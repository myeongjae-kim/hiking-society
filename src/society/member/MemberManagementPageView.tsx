import Link from "#/society/shared/components/AppLink";
import type { AuthenticatedUser } from "@/core/auth/model/AuthenticatedUser";
import { roleLabels } from "@/core/auth/model/roleLabels";
import { canChangeRole, type UserRole } from "@/core/auth/model/roles";
import type { MemberListItem } from "@/core/member/model/MemberListItem";
import { MemberRoleForm } from "./components/MemberRoleForm";

const roleOptions = [
	"associate",
	"member",
	"admin",
] as const satisfies readonly UserRole[];

function formatDate(value: Date | null) {
	return value ? value.toISOString().slice(0, 10) : "null";
}

type MembersPageViewProps = {
	actor: AuthenticatedUser;
	members: readonly MemberListItem[];
};

export default function MembersPageView({
	actor,
	members,
}: MembersPageViewProps) {
	return (
		<main className="min-h-svh bg-[length:2rem_2rem] bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] p-4 text-[var(--foreground0)] lg:p-8">
			<section
				className="!p-5 mx-auto grid w-[min(100%,72rem)] gap-5 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] [--box-border-color:var(--overlay0)] [--box-border-width:1px]"
				box-="round"
			>
				<header className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="m-0 font-mono text-[var(--mauve)] text-sm">
							$ members.list
						</p>
						<h1 className="m-0 mt-1 text-3xl text-[var(--blue)]">회원 관리</h1>
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
						<Link is-="button" size-="small" variant-="foreground1" href="/me">
							마이페이지
						</Link>
					</nav>
				</header>

				<div className="overflow-x-auto">
					<table className="min-w-full" divide-="both">
						<thead>
							<tr className="text-[var(--subtext0)]">
								<th>회원</th>
								<th>이메일</th>
								<th>제공자</th>
								<th>가입일</th>
								<th>최근 로그인</th>
								<th>권한</th>
							</tr>
						</thead>
						<tbody>
							{members.map((member) => (
								<tr key={`${member.id}-${member.provider ?? "none"}`}>
									<td className="min-w-[12rem] text-[var(--pink)]">
										{member.displayName ?? member.name ?? `user-${member.id}`}
									</td>
									<td className="min-w-[16rem] [overflow-wrap:anywhere]">
										{member.email ?? "null"}
									</td>
									<td>{member.provider ?? "null"}</td>
									<td>{formatDate(member.createdAt)}</td>
									<td>{formatDate(member.lastLoginAt)}</td>
									<td>
										<MemberRoleForm userId={member.id}>
											<input type="hidden" name="userId" value={member.id} />
											<select
												className="bg-[var(--background1)] px-2 py-1 text-[var(--foreground0)]"
												defaultValue={member.role}
												name="role"
												disabled={
													!roleOptions.some((role) =>
														canChangeRole(actor.role, member.role, role),
													)
												}
											>
												{roleOptions.map((role) => (
													<option
														value={role}
														key={role}
														disabled={
															!canChangeRole(actor.role, member.role, role)
														}
													>
														{roleLabels[role]}
													</option>
												))}
											</select>
											<button
												size-="small"
												type="submit"
												disabled={
													!roleOptions.some((role) =>
														canChangeRole(actor.role, member.role, role),
													)
												}
											>
												저장
											</button>
										</MemberRoleForm>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
		</main>
	);
}
