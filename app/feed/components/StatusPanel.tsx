import { Command } from '@/app/common/components/Command';
import { StatusRow } from '@/app/common/components/StatusRow';
import { boxBorderClassName } from '@/app/common/components/styles';
import type { AuthorName } from '@/core/common/domain';

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
      className={`grid gap-3 self-start bg-[var(--surface0)] !p-4 lg:![position:sticky] lg:top-2 ${boxBorderClassName}`}
      box-="round"
      aria-label="피드 상태"
    >
      <Command>status --ui-only</Command>
      <dl className="m-0 grid gap-2">
        <StatusRow label="접근" value="초대 멤버" />
        <StatusRow label="보기" value="사진 기록" />
        <StatusRow label="사용자" value={String(currentAuthorName)} />
        <StatusRow label="산행 묶음" value={groupCount} />
        <StatusRow label="산행" value={hikingCount} />
        <StatusRow label="게시글" value={articleCount} />
        <StatusRow label="댓글" value={commentCount} />
      </dl>
    </aside>
  );
}
