import type { ReactNode } from "react";

const commandClassName =
	"m-0 font-mono text-sm leading-[1.4] text-[var(--mauve)]";

export function Command({ children }: { children: ReactNode }) {
	return (
		<p className={commandClassName}>
			<span className="text-[var(--peach)]">$ </span>
			{children}
		</p>
	);
}
