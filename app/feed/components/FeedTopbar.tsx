import Link from 'next/link';

import { Command } from '@/app/common/components/Command';
import { inlineButtonClassName } from '@/app/common/components/styles';
import { NotificationPopover } from '@/app/notification/components/NotificationPopover';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import { roleLabels } from '@/core/auth/model/roleLabels';
import type { AuthorName } from '@/core/common/domain';
import type { NotificationListSnapshot } from '@/core/notification/model/Notification';

type FeedTopbarProps = {
  currentAuthorName: AuthorName;
  notificationSnapshot?: NotificationListSnapshot;
  user: AuthenticatedUser;
};

export function FeedTopbar({ currentAuthorName, notificationSnapshot, user }: FeedTopbarProps) {
  return (
    <header className="border-b border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--background0)_92%,transparent)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Command>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" className="">
            대학생(?)등산동아리
          </a>{' '}
          /feed
        </Command>
        <nav className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs leading-[1.4] text-[var(--subtext0)]">
            {String(currentAuthorName)} · {roleLabels[user.role]}
          </span>
          <NotificationPopover notificationSnapshot={notificationSnapshot} />
          <Link
            aria-label="마이페이지"
            className={`${inlineButtonClassName} aspect-square !min-h-8 !w-8 !px-0`}
            href="/me"
            title="마이페이지"
          >
            MY
          </Link>
        </nav>
      </div>
    </header>
  );
}
