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
  const runMenuAction = (event: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    event.currentTarget.closest('details')?.removeAttribute('open');
    action();
  };

  return (
    <>
      <header className="sticky top-2 z-20 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-4 py-3 shadow-[0_0.35rem_0_var(--background0)]">
        <h2
          className="m-0 text-[1.25rem] leading-[1.1] tracking-normal break-keep text-[var(--blue)] sm:text-[1.75rem]"
          id={`hiking-${hiking.id}`}
        >
          {hiking.mountainName}
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-sm text-[var(--yellow)] sm:text-base">
            {formatDateLabel(hiking.hikingDate)}
          </span>
          <ActionButton onClick={onAddArticle}>글 작성</ActionButton>
          {canManageHiking ? (
            <details className="relative" is-="popover" position-="bottom left">
              <summary
                aria-label="산행 관리 메뉴"
                className="inline-flex !h-auto !min-h-[1.75rem] min-w-[2.25rem] cursor-pointer list-none items-center justify-center !border !border-[var(--overlay0)] !bg-[var(--surface0)] !bg-none !px-1 !py-1 font-mono !text-sm leading-[1.2] whitespace-nowrap !text-[var(--foreground0)] hover:!bg-[var(--surface1)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] active:!bg-[var(--surface2)] active:!text-[var(--foreground0)] [&::-webkit-details-marker]:hidden"
                title="산행 관리 메뉴"
              >
                ⋮
              </summary>
              <div className="grid min-w-24 gap-1 border border-[var(--overlay0)] bg-[var(--background1)] p-1 shadow-[0_0.35rem_0_var(--background0)]">
                <button
                  className="!h-auto !min-h-0 w-full appearance-none !border-0 !bg-transparent !bg-none px-3 py-1.5 text-left font-mono text-sm leading-[1.2] whitespace-nowrap !text-[var(--foreground0)] hover:!bg-[var(--surface1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                  onClick={(event) => runMenuAction(event, onEdit)}
                  type="button"
                >
                  수정
                </button>
                <button
                  className="!h-auto !min-h-0 w-full appearance-none !border-0 !bg-transparent !bg-none px-3 py-1.5 text-left font-mono text-sm leading-[1.2] whitespace-nowrap !text-[var(--red)] hover:!bg-[var(--surface1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                  onClick={(event) => runMenuAction(event, onDelete)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            </details>
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
