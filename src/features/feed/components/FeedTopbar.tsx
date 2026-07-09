import * as Popover from "@radix-ui/react-popover";
import { NotificationPopover } from "#/features/notification/components/NotificationPopover";
import Link from "#/features/shared/components/AppLink";
import { Command } from "#/features/shared/components/Command";
import { inlineButtonClassName } from "#/features/shared/components/styles";
import { ThemeSelector } from "#/features/shared/components/ThemeSelector";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import { roleLabels } from "@/core/auth/model/roleLabels";
import type { AuthorName } from "@/core/common/domain";
import type { NotificationListSnapshot } from "@/core/notification/model/Notification";

type FeedTopbarProps = {
	currentAuthorName: AuthorName;
	currentTheme?: string;
	notificationSnapshot?: NotificationListSnapshot;
	user: AuthenticatedUser;
};

export function FeedTopbar({
	currentAuthorName,
	currentTheme,
	notificationSnapshot,
	user,
}: FeedTopbarProps) {
	const notificationSnapshotKey = notificationSnapshot
		? [
				notificationSnapshot.hasMoreNotifications,
				notificationSnapshot.hasUnreadNotifications,
				notificationSnapshot.notifications.length,
				notificationSnapshot.notifications[0]?.id ?? "",
				notificationSnapshot.notifications.at(-1)?.id ?? "",
			].join(":")
		: "empty";

	return (
		<header className="border-[var(--overlay0)] border-b bg-[color-mix(in_srgb,var(--background0)_92%,transparent)] px-4 py-3">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
				<Command>
					<a href="/" className="">
						대학생(?)등산동아리
					</a>{" "}
					/feed
				</Command>
				<nav className="ml-auto flex flex-wrap items-center gap-2">
					<span className="font-mono text-[var(--subtext0)] text-xs leading-[1.4]">
						{String(currentAuthorName)} · {roleLabels[user.role]}
					</span>
					<NotificationPopover
						key={notificationSnapshotKey}
						notificationSnapshot={notificationSnapshot}
					/>
					<Link
						aria-label="마이페이지"
						className={`${inlineButtonClassName} !min-h-8 !w-8 !px-0 aspect-square`}
						href="/me"
						title="마이페이지"
					>
						MY
					</Link>
					{currentTheme ? (
						<Popover.Root>
							<Popover.Trigger asChild>
								<button
									aria-label="테마 선택"
									className={`${inlineButtonClassName} !min-h-8 !w-8 !px-0 aspect-square`}
									title="테마 선택"
									type="button"
								>
									테마
								</button>
							</Popover.Trigger>
							<Popover.Portal>
								<Popover.Content
									align="end"
									className="z-[70] w-[min(18rem,calc(100vw-2rem))] border border-[var(--overlay0)] bg-[var(--background0)] p-2 text-[var(--foreground0)] shadow-[0.25rem_0.25rem_0_var(--surface0)]"
									sideOffset={8}
								>
									<ThemeSelector autoOpenOnMount initialTheme={currentTheme} />
								</Popover.Content>
							</Popover.Portal>
						</Popover.Root>
					) : null}
				</nav>
			</div>
		</header>
	);
}
