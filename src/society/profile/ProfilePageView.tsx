import type { ReactNode } from "react";
import {
	canViewMemberManagement,
	userRoleLabels,
} from "#/society/shared/authViewPolicy";
import Link from "#/society/shared/components/AppLink";
import { inlineButtonClassName } from "#/society/shared/components/styles";
import { ThemeSelector } from "#/society/shared/components/ThemeSelector";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import { LogoutButton } from "../auth/components/LogoutButton";
import {
	DisplayNameEditDialog,
	EmailEditDialog,
	ProfileImageEditDialog,
} from "./components/ProfileEditDialogs";

function formatDate(value: Date | null) {
	return value ? value.toISOString().slice(0, 19).replace("T", " ") : "null";
}

function Row({
	action,
	label,
	value,
}: {
	action?: ReactNode;
	label: string;
	value: ReactNode;
}) {
	return (
		<div className="grid grid-cols-1 gap-2 border-[var(--overlay0)] border-b border-dotted pb-2 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4">
			<dt className="text-[var(--subtext0)]">{label}</dt>
			<dd className="m-0 min-w-0 text-[var(--foreground0)] [overflow-wrap:anywhere]">
				{value}
			</dd>
			<div className="min-w-0">{action}</div>
		</div>
	);
}

function getProfileInitial(value: string) {
	return value.trim().charAt(0).toUpperCase() || "?";
}

type MyPageViewProps = {
	theme: string;
	user: AuthenticatedUser;
};

export default function MyPageView({ theme, user }: MyPageViewProps) {
	const displayName = user.displayName ?? user.name ?? user.email ?? "회원";
	const profileInitial = getProfileInitial(displayName);

	return (
		<main className="min-h-svh bg-[var(--background0)] p-4 text-[var(--foreground0)] lg:p-8">
			<section
				className="!p-5 mx-auto grid w-[min(100%,48rem)] gap-5 bg-[var(--surface0)] [--box-border-color:var(--overlay0)] [--box-border-width:1px]"
				box-="round"
			>
				<header className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-4">
						<div className="relative size-20 shrink-0">
							{user.profileImageUrl ? (
								<img
									src={user.profileImageUrl}
									alt={`${displayName} 프로필 사진`}
									className="size-20 rounded-full border border-[var(--overlay0)] object-cover"
								/>
							) : (
								<div
									aria-label={`${displayName} 프로필 사진 없음`}
									className="grid size-20 rounded-full border border-[var(--overlay0)] bg-[var(--background1)] text-3xl text-[var(--blue)]"
									role="img"
								>
									<span className="place-self-center">{profileInitial}</span>
								</div>
							)}
							<ProfileImageEditDialog
								displayName={displayName}
								profileImageUrl={user.profileImageUrl}
								trigger={
									<button
										aria-label="프로필 이미지 수정"
										className={`absolute -right-2 -bottom-1 z-10 ${inlineButtonClassName} !min-h-[1.5rem] !px-1 !py-0 !text-xs shadow-[0.12rem_0.12rem_0_var(--background0)]`}
										type="button"
									>
										수정
									</button>
								}
							/>
						</div>
						<div className="min-w-0">
							<p className="m-0 font-mono text-[var(--mauve)] text-sm">
								$ profile.show
							</p>
							<h1 className="m-0 mt-1 text-3xl text-[var(--blue)]">
								마이페이지
							</h1>
						</div>
					</div>
					<nav className="flex flex-wrap gap-2">
						<Link
							is-="button"
							size-="small"
							variant-="foreground1"
							href="/feed"
						>
							피드
						</Link>
						{canViewMemberManagement(user.role) ? (
							<Link
								is-="button"
								size-="small"
								variant-="foreground1"
								href="/members"
							>
								회원 관리
							</Link>
						) : null}
					</nav>
				</header>

				<dl className="m-0 grid gap-3">
					<Row
						action={<DisplayNameEditDialog displayName={displayName} />}
						label="이름"
						value={displayName}
					/>
					<Row
						action={<EmailEditDialog email={user.email} />}
						label="이메일"
						value={user.email}
					/>
					<Row
						label="테마"
						value={
							<div className="w-full sm:w-fit">
								<ThemeSelector initialTheme={theme} />
							</div>
						}
					/>
					<Row label="권한" value={userRoleLabels[user.role]} />
					<Row label="로그인 제공자" value={user.provider ?? "null"} />
					<Row label="최근 로그인" value={formatDate(user.lastLoginAt)} />
				</dl>

				<LogoutButton />
			</section>
		</main>
	);
}
