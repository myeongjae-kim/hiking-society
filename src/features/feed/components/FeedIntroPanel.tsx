import { ActionButton } from '#/features/shared/components/ActionButton';
import { Command } from '#/features/shared/components/Command';
import { boxBorderClassName } from '#/features/shared/components/styles';

type FeedIntroPanelProps = {
  onCreateHiking: () => void;
};

export function FeedIntroPanel({ onCreateHiking }: FeedIntroPanelProps) {
  return (
    <section
      className={`grid gap-4 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-4 ${boxBorderClassName}`}
      box-="round"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Command>{'echo "hello, hiking!"'}</Command>
        <ActionButton onClick={onCreateHiking}>산행 등록</ActionButton>
      </div>
    </section>
  );
}
