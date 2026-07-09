import type { ReactNode } from "react";

export function InlineMeta({ items }: { items: readonly ReactNode[] }) {
	return (
		<p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[var(--subtext0)] text-sm leading-[1.45]">
			{items.map((item, index) => (
				<span className="inline-flex items-center gap-x-2" key={index}>
					{index > 0 ? (
						<span aria-hidden="true" className="text-[var(--overlay1)]">
							·
						</span>
					) : null}
					<span className={index === 0 ? "text-[var(--pink)]" : undefined}>
						{item}
					</span>
				</span>
			))}
		</p>
	);
}
