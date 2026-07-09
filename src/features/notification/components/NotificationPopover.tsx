'use client';

import * as Popover from '@radix-ui/react-popover';
import { useRouter } from '#/features/shared/hooks/useRouter';
import { useMemo, useState, useTransition } from 'react';

import { $api } from '#/api/client/$api';
import { apiQueryKeys } from '#/api/client/queryKeys';
import { DateTimeLabel } from '#/features/shared/components/DateTimeLabel';
import { inlineButtonClassName } from '#/features/shared/components/styles';
import type {
  NotificationListSnapshot,
  NotificationSummary,
} from '@/core/notification/model/Notification';
import { useQueryClient } from '@tanstack/react-query';

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
  'grid !h-auto !min-h-[4.75rem] w-full min-w-0 shrink-0 appearance-none grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-2 border border-[var(--overlay0)] !bg-[var(--background1)] !bg-none px-3 py-2 text-left font-normal leading-normal !text-[var(--foreground0)] !no-underline hover:!bg-[var(--surface1)] hover:!no-underline focus:font-normal focus:!no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] active:!bg-[var(--surface2)] active:!text-[var(--foreground0)] active:!no-underline disabled:cursor-wait';

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
      return `${notification.actorName}님이 새 글을 등록했습니다.`;
    case 'article_comment':
      return `${notification.actorName}님이 내 글에 댓글을 남겼습니다.`;
    case 'article_reply':
      return `${notification.actorName}님이 내 글의 댓글에 답글을 남겼습니다.`;
    case 'comment_reply':
      return `${notification.actorName}님이 내 댓글에 답글을 남겼습니다.`;
    case 'article_like':
      return `${notification.actorName}님이 내 글을 좋아합니다.`;
    case 'comment_like':
      return `${notification.actorName}님이 내 댓글을 좋아합니다.`;
  }
}

export function NotificationPopover({
  notificationSnapshot = emptyNotificationSnapshot,
}: NotificationPopoverProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const markNotificationReadMutation = $api.useMutation(
    'patch',
    '/api/notifications/{notificationId}/read',
  );
  const markAllNotificationsReadMutation = $api.useMutation('patch', '/api/notifications/read-all');
  const notificationsQuery = $api.useInfiniteQuery(
    'get',
    '/api/notifications',
    { params: { query: { limit: NOTIFICATION_PAGE_SIZE, offset: null } } },
    {
      getNextPageParam: (lastPage, allPages) =>
        lastPage.hasMoreNotifications
          ? allPages.reduce((count, page) => count + page.notifications.length, 0)
          : undefined,
      initialData: {
        pageParams: [0],
        pages: [
          {
            ...notificationSnapshot,
            notifications: [...notificationSnapshot.notifications],
          },
        ],
      },
      initialPageParam: 0,
      pageParamName: 'offset',
    },
  );
  const [readNotificationIds, setReadNotificationIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [allReadAt, setAllReadAt] = useState<NotificationSummary['readAt'] | null>(null);
  const [isPending, startTransition] = useTransition();
  const notificationPages = useMemo(
    () => (notificationsQuery.data?.pages ?? []) as unknown as readonly NotificationListSnapshot[],
    [notificationsQuery.data?.pages],
  );
  const lastPage = notificationPages.at(-1) ?? emptyNotificationSnapshot;
  const hasMoreNotifications = lastPage.hasMoreNotifications;
  const hasUnreadNotifications = allReadAt ? false : lastPage.hasUnreadNotifications;
  const notifications = useMemo(
    () =>
      notificationPages.flatMap((page) =>
        page.notifications.map((notification) => {
          const readAt =
            notification.readAt ??
            allReadAt ??
            (readNotificationIds.has(notification.id)
              ? (new Date().toISOString() as NotificationSummary['readAt'])
              : null);

          return { ...notification, readAt } satisfies NotificationSummary;
        }),
      ),
    [allReadAt, notificationPages, readNotificationIds],
  );

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: apiQueryKeys.notifications() });
  };

  const readNotification = (notification: NotificationSummary) => {
    startTransition(async () => {
      await markNotificationReadMutation.mutateAsync({
        params: { path: { notificationId: notification.id } },
      });

      setReadNotificationIds((current) => new Set(current).add(notification.id));
      invalidateNotifications();
      router.push(getNotificationHref(notification));
    });
  };

  const readAllNotifications = () => {
    startTransition(async () => {
      await markAllNotificationsReadMutation.mutateAsync({});

      setAllReadAt(new Date().toISOString() as NotificationSummary['readAt']);
      invalidateNotifications();
    });
  };

  const loadMoreNotifications = () => {
    startTransition(async () => {
      await notificationsQuery.fetchNextPage();
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
          className="z-[70] ml-1.5 grid w-[min(24rem,calc(100vw-1rem))] gap-2 border border-[var(--overlay0)] bg-[var(--background0)] p-2 text-[var(--foreground0)] shadow-[0.25rem_0.25rem_0_var(--surface0)]"
          sideOffset={8}
        >
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="font-mono text-sm text-[var(--foreground0)]">notifications</span>
            <button
              className={`${inlineButtonClassName} !min-h-[1.5rem] !px-2 !py-0.5 !text-xs`}
              disabled={
                isPending || markAllNotificationsReadMutation.isPending || !hasUnreadNotifications
              }
              onClick={readAllNotifications}
              type="button"
            >
              모두 확인
            </button>
          </div>
          <div className="flex max-h-[min(28rem,calc(100svh-8rem))] flex-col gap-1 overflow-y-auto">
            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => {
                  const unread = notification.readAt === null;

                  return (
                    <button
                      className={`${notificationItemClassName} ${
                        unread ? 'shadow-[inset_0.25rem_0_0_var(--red)]' : 'opacity-75'
                      }`}
                      disabled={isPending || markNotificationReadMutation.isPending}
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
                    className={`${inlineButtonClassName} !min-h-[2rem] w-full shrink-0 !px-3 !py-1 text-sm`}
                    disabled={isPending || notificationsQuery.isFetchingNextPage}
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
