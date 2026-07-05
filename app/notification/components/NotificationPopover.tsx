'use client';

import * as Popover from '@radix-ui/react-popover';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { $api, fetchClient } from '@/app/common/api/$api';
import { DateTimeLabel } from '@/app/common/components/DateTimeLabel';
import { inlineButtonClassName } from '@/app/common/components/styles';
import type {
  NotificationListSnapshot,
  NotificationSummary,
} from '@/core/notification/model/Notification';

type NotificationPopoverProps = {
  notificationSnapshot?: NotificationListSnapshot;
};

const emptyNotificationSnapshot: NotificationListSnapshot = {
  hasMoreNotifications: false,
  hasUnreadNotifications: false,
  notifications: [],
};

const NOTIFICATION_PAGE_SIZE = 20;

const notificationItemClassName =
  'grid !h-auto !min-h-0 w-full min-w-0 appearance-none grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-2 border border-[var(--overlay0)] !bg-[var(--background1)] !bg-none px-3 py-2 text-left font-normal leading-normal !text-[var(--foreground0)] !no-underline hover:!bg-[var(--surface1)] hover:!no-underline focus:font-normal focus:!no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] active:!bg-[var(--surface2)] active:!text-[var(--foreground0)] active:!no-underline disabled:cursor-wait';

function getInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || '?';
}

function NotificationAvatar({ notification }: { notification: NotificationSummary }) {
  if (notification.actorProfileImageUrl) {
    return (
      <img
        alt={`${notification.actorName} 프로필 사진`}
        className="mt-0.5 size-7 rounded-full border border-[var(--overlay0)] object-cover"
        src={notification.actorProfileImageUrl}
      />
    );
  }

  return (
    <span
      aria-label={`${notification.actorName} 프로필 사진 없음`}
      className="mt-0.5 grid size-7 rounded-full border border-[var(--overlay0)] bg-[var(--background0)] font-mono text-xs leading-none text-[var(--blue)]"
    >
      <span className="place-self-center">{getInitial(String(notification.actorName))}</span>
    </span>
  );
}

function getNotificationHref(notification: NotificationSummary) {
  if (notification.commentId === null) {
    return `/article/${notification.articleId}`;
  }

  return `/article/${notification.articleId}?commentId=${notification.commentId}`;
}

function getNotificationMessage(notification: NotificationSummary) {
  switch (notification.type) {
    case 'article_created':
      return `${notification.actorName}님이 새 게시글을 등록했습니다.`;
    case 'article_comment':
      return `${notification.actorName}님이 내 게시글에 댓글을 남겼습니다.`;
    case 'article_reply':
      return `${notification.actorName}님이 내 게시글의 댓글에 답글을 남겼습니다.`;
    case 'comment_reply':
      return `${notification.actorName}님이 내 댓글에 답글을 남겼습니다.`;
    case 'article_like':
      return `${notification.actorName}님이 내 게시글을 좋아합니다.`;
    case 'comment_like':
      return `${notification.actorName}님이 내 댓글을 좋아합니다.`;
  }
}

export function NotificationPopover({
  notificationSnapshot = emptyNotificationSnapshot,
}: NotificationPopoverProps) {
  const router = useRouter();
  const markNotificationReadMutation = $api.useMutation(
    'patch',
    '/api/notifications/{notificationId}/read',
  );
  const markAllNotificationsReadMutation = $api.useMutation('patch', '/api/notifications/read-all');
  const [snapshot, setSnapshot] = useState(() => notificationSnapshot);
  const [isPending, startTransition] = useTransition();
  const { hasMoreNotifications, hasUnreadNotifications, notifications } = snapshot;

  const markLoadedNotificationRead = (notificationId: string) => {
    setSnapshot((current) => ({
      ...current,
      notifications: current.notifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              readAt: new Date().toISOString() as NotificationSummary['readAt'],
            }
          : notification,
      ),
    }));
  };

  const readNotification = (notification: NotificationSummary) => {
    startTransition(async () => {
      await markNotificationReadMutation.mutateAsync({
        params: { path: { notificationId: notification.id } },
      });

      markLoadedNotificationRead(notification.id);
      router.push(getNotificationHref(notification));
      router.refresh();
    });
  };

  const readAllNotifications = () => {
    startTransition(async () => {
      await markAllNotificationsReadMutation.mutateAsync({});

      setSnapshot((current) => ({
        ...current,
        hasUnreadNotifications: false,
        notifications: current.notifications.map((notification) => ({
          ...notification,
          readAt:
            notification.readAt ?? (new Date().toISOString() as NotificationSummary['readAt']),
        })),
      }));
      router.refresh();
    });
  };

  const loadMoreNotifications = () => {
    startTransition(async () => {
      const { data } = await fetchClient.GET('/api/notifications', {
        params: { query: { limit: NOTIFICATION_PAGE_SIZE, offset: notifications.length } },
      });

      if (!data) {
        throw new Error('알림을 불러오지 못했습니다.');
      }

      setSnapshot((current) => ({
        hasMoreNotifications: data.hasMoreNotifications,
        hasUnreadNotifications: data.hasUnreadNotifications,
        notifications: [
          ...current.notifications,
          ...(data.notifications as unknown as readonly NotificationSummary[]),
        ],
      }));
    });
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          aria-label={hasUnreadNotifications ? '미확인 알림 있음' : '알림'}
          className={`${inlineButtonClassName} relative aspect-square !min-h-8 !w-8 !px-0`}
          title="알림"
          type="button"
        >
          <span aria-hidden="true" className="font-mono text-lg leading-none font-bold">
            !
          </span>
          {hasUnreadNotifications ? (
            <span
              aria-hidden="true"
              className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--red)] shadow-[0_0_0_2px_var(--surface0)]"
            />
          ) : null}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          className="z-[70] grid w-[min(24rem,calc(100vw-1rem))] gap-2 border border-[var(--overlay0)] bg-[var(--background0)] p-2 text-[var(--foreground0)] shadow-[0.25rem_0.25rem_0_var(--surface0)]"
          sideOffset={8}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="font-mono text-sm text-[var(--foreground0)]">notifications</span>
            <button
              className={`${inlineButtonClassName} !min-h-[1.5rem] !px-2 !py-0.5 !text-xs`}
              disabled={isPending || !hasUnreadNotifications}
              onClick={readAllNotifications}
              type="button"
            >
              모두 확인
            </button>
          </div>
          <div className="grid max-h-[min(28rem,calc(100svh-8rem))] gap-1 overflow-y-auto">
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => {
                  const unread = notification.readAt === null;

                  return (
                    <button
                      className={`${notificationItemClassName} ${
                        unread ? 'shadow-[inset_0.25rem_0_0_var(--red)]' : 'opacity-75'
                      }`}
                      disabled={isPending}
                      key={notification.id}
                      onClick={() => readNotification(notification)}
                      type="button"
                    >
                      <NotificationAvatar notification={notification} />
                      <span className="grid min-w-0 justify-items-start gap-1">
                        <span className="min-w-0 text-left text-sm leading-[1.4] [overflow-wrap:anywhere] !no-underline">
                          {getNotificationMessage(notification)}
                        </span>
                        <span className="block w-full min-w-0 truncate text-left text-xs text-[var(--subtext0)] !no-underline">
                          {notification.contentExcerpt}
                        </span>
                        <DateTimeLabel
                          className="font-mono text-xs text-[var(--subtext0)] !no-underline"
                          value={notification.createdAt}
                        />
                      </span>
                    </button>
                  );
                })}
                {hasMoreNotifications ? (
                  <button
                    className={`${inlineButtonClassName} !min-h-[2rem] w-full !px-3 !py-1 text-sm`}
                    disabled={isPending}
                    onClick={loadMoreNotifications}
                    type="button"
                  >
                    더 보기
                  </button>
                ) : null}
              </>
            ) : (
              <p className="m-0 border border-[var(--overlay0)] bg-[var(--background1)] px-3 py-4 text-sm text-[var(--subtext0)]">
                아직 알림이 없습니다.
              </p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
