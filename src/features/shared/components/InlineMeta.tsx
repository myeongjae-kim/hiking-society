import { isValidElement, type ReactNode } from "react";

function getInlineMetaKey(item: ReactNode) {
	if (isValidElement(item) && item.key !== null) {
		return String(item.key);
	}
	if (typeof item === "string" || typeof item === "number") {
		return String(item);
	}
	return "inline-meta-item";
}

export function InlineMeta({ items }: { items: readonly ReactNode[] }) {
	return (
		<p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[var(--subtext0)] text-sm leading-[1.45]">
			{items.map((item, index) => (
				<span
					className="inline-flex items-center gap-x-2"
					key={getInlineMetaKey(item)}
				>
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
