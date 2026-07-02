import type { ReactNode } from 'react';

export function StatusRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-[var(--overlay0)] pb-1.5">
      <dt className="m-0 text-[var(--subtext0)]">{label}</dt>
      <dd className="m-0 text-[var(--green)]">{value}</dd>
    </div>
  );
}
