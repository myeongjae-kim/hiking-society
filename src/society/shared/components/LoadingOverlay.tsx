
type LoadingOverlayProps = {
	label?: string;
	open: boolean;
};

export function LoadingOverlay({
	label = "로딩 중",
	open,
}: LoadingOverlayProps) {
	if (!open) {
		return null;
	}

	return (
		<div
			aria-live="polite"
			className="fixed inset-0 z-50 grid place-items-center bg-[color-mix(in_srgb,var(--background0)_56%,transparent)] p-4 text-[var(--foreground0)]"
			role="status"
		>
			<div className="grid min-w-32 justify-items-center gap-3 border border-[var(--overlay0)] bg-[var(--surface0)] px-5 py-4 shadow-[0.35rem_0.35rem_0_var(--background0)]">
				<span is-="spinner" variant-="dots" />
				<span className="font-mono text-sm leading-[1.2]">{label}</span>
			</div>
		</div>
	);
}
