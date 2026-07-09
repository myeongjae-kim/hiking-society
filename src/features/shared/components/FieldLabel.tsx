import type { ReactNode } from "react";

import { labelClassName } from "./styles";

export function FieldLabel({
	children,
	label,
	ariaLabel,
	htmlFor,
}: {
	children: ReactNode;
	label: string;
	ariaLabel?: string | undefined;
	htmlFor?: string | undefined;
}) {
	return (
		<label htmlFor={htmlFor} aria-label={ariaLabel} className={labelClassName}>
			<span>{label}</span>
			{children}
		</label>
	);
}
