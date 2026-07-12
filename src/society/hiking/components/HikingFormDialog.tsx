
import * as Dialog from "@radix-ui/react-dialog";

import { dialogOverlayClassName } from "#/society/shared/components/styles";
import type { HikingViewModel as Hiking } from "#/society/shared/viewModels";

import { HikingForm } from "./HikingForm";
import type { HikingFormValues } from "./hikingFormTypes";

type HikingFormDialogProps = {
	error?: string;
	formKey: string;
	hiking?: Hiking;
	onCancel: () => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: HikingFormValues) => void;
	open: boolean;
	submitting?: boolean;
	title: string;
};

export function HikingFormDialog({
	error,
	formKey,
	hiking,
	onCancel,
	onOpenChange,
	onSubmit,
	open,
	submitting = false,
	title,
}: HikingFormDialogProps) {
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Overlay className={dialogOverlayClassName} />
				<Dialog.Content className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[var(--foreground0)] outline-none">
					<Dialog.Title className="sr-only">{title}</Dialog.Title>
					<div className="max-h-[calc(100svh-2rem)] w-full max-w-[48rem] overflow-y-auto">
						<HikingForm
							error={error}
							hiking={hiking}
							key={formKey}
							onCancel={onCancel}
							onSubmit={onSubmit}
							submitting={submitting}
						/>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	);
}
