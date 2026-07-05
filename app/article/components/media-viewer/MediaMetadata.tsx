import type { MetadataPanelItem } from './types';

type MediaMetadataProps = {
  itemCount: number;
  items: readonly MetadataPanelItem[];
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  selectedIndex: number;
};

export function MediaMetadata({ itemCount, items, onClick, selectedIndex }: MediaMetadataProps) {
  if (items.length === 0) {
    return (
      <p
        className="m-0 justify-self-center font-mono text-sm text-[var(--subtext0)] sm:border sm:border-[var(--overlay0)] sm:bg-[var(--surface0)] sm:px-2 sm:py-1"
        data-media-modal-surface
        onClick={onClick}
      >
        frame {selectedIndex + 1}/{itemCount}
      </p>
    );
  }

  return (
    <footer
      className="w-fit max-w-full justify-self-center overflow-x-hidden overflow-y-hidden px-2"
      data-media-modal-surface
      onClick={onClick}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <p className="m-0 shrink-0 font-mono text-[0.68rem] leading-tight tracking-[0.14em] text-[var(--subtext0)] uppercase">
          frame {selectedIndex + 1}/{itemCount}
        </p>
        <dl className="contents">
          {items.map((item, index) => (
            <div className="contents" key={item.label}>
              <dt className="sr-only font-mono text-[0.68rem] leading-none tracking-[0.16em] text-[var(--subtext0)] uppercase">
                {item.label}
              </dt>
              <dd className="m-0 max-w-full min-w-0 text-center font-mono text-xs leading-tight break-words text-[var(--foreground0)]">
                {item.value}
                {index < items.length - 1 ? (
                  <span aria-hidden="true" className="ml-2 text-[var(--overlay1)]">
                    ·
                  </span>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </footer>
  );
}
