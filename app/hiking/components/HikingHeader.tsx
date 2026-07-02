import { ActionButton } from '@/app/common/components/ActionButton';
import type { Hiking } from '@/core/hiking/domain';

import { formatDateLabel, getHikingMeta } from './hikingFormUtils';

type HikingHeaderProps = {
  canManageHiking: boolean;
  error?: string;
  hiking: Hiking;
  onAddArticle: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

export function HikingHeader({
  canManageHiking,
  error,
  hiking,
  onAddArticle,
  onDelete,
  onEdit,
}: HikingHeaderProps) {
  return (
    <>
      <header className="sticky top-2 z-20 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-4 py-3 shadow-[0_0.35rem_0_var(--background0)]">
        <h2
          className="m-0 text-[1.75rem] leading-[1.1] tracking-normal text-[var(--blue)]"
          id={`hiking-${hiking.id}`}
        >
          {hiking.mountainName}
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-[var(--yellow)]">{formatDateLabel(hiking.hikingDate)}</span>
          <ActionButton onClick={onAddArticle}>글 작성</ActionButton>
          {canManageHiking ? (
            <>
              <ActionButton onClick={onEdit}>수정</ActionButton>
              <ActionButton onClick={onDelete} tone="danger">
                삭제
              </ActionButton>
            </>
          ) : null}
        </div>
      </header>
      <div className="border border-t-0 border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--surface0)_68%,transparent)] px-4 pt-2.5 pb-3">
        <p className="mt-1 mb-0 font-mono text-sm leading-[1.45] [overflow-wrap:anywhere] text-[var(--foreground1)]">
          {getHikingMeta(hiking).join('  ')}
        </p>
        <p className="mt-1 mb-0 font-mono text-sm leading-[1.45] [overflow-wrap:anywhere] text-[var(--foreground1)]">
          members={hiking.participantsCsv}
        </p>
        <p className="mt-1 mb-0 font-mono text-sm leading-[1.45] [overflow-wrap:anywhere] text-[var(--foreground1)]">
          restaurant={hiking.restaurantAddress ?? 'null'}
        </p>
        {error ? <p className="mt-2 mb-0 text-sm text-[var(--red)]">{error}</p> : null}
      </div>
    </>
  );
}
