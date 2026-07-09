import { Command } from "#/society/shared/components/Command";
import { StatusRow } from "#/society/shared/components/StatusRow";
import { boxBorderClassName } from "#/society/shared/components/styles";
import type { AuthorName } from "@/core/common/domain";

type StatusPanelProps = {
	articleCount: number;
	commentCount: number;
	currentAuthorName: AuthorName;
	groupCount: number;
	hikingCount: number;
};

export function StatusPanel({
	articleCount,
	commentCount,
	currentAuthorName,
	groupCount,
	hikingCount,
}: StatusPanelProps) {
	return (
		<aside
			className={`!p-4 lg:![position:sticky] grid gap-3 self-start bg-[var(--surface0)] lg:top-2 ${boxBorderClassName}`}
			box-="round"
			aria-label="피드 상태"
		>
			<Command>status --ui-only</Command>
			<dl className="m-0 grid gap-2">
				<StatusRow label="access" value="invite" />
				<StatusRow label="mode" value="photo-log" />
				<StatusRow label="actor" value={String(currentAuthorName)} />
				<StatusRow label="groups" value={groupCount} />
				<StatusRow label="hikings" value={hikingCount} />
				<StatusRow label="articles" value={articleCount} />
				<StatusRow label="comments" value={commentCount} />
			</dl>
		</aside>
	);
}
