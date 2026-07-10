"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useCallback, useState } from "react";

import {
	dialogOverlayClassName,
	inlineButtonClassName,
} from "#/society/shared/components/styles";
import type { ArticleViewModel as Article } from "#/society/shared/viewModels";
import type { HikingViewModel as Hiking } from "#/society/shared/viewModels";

import { ArticleForm } from "./ArticleForm";
import type { ArticleFormValues } from "./articleFormTypes";

type ArticleFormDialogProps = {
	article?: Article;
	error?: string;
	formKey: string;
	hiking?: Hiking;
	onCancel: () => void;
	onOpenChange: (open: boolean) => void;
	onSubmit: (values: ArticleFormValues) => void;
	open: boolean;
	submitting?: boolean;
	title: string;
};

export function ArticleFormDialog({
	article,
	error,
	formKey,
	hiking,
	onOpenChange,
	onSubmit,
	open,
	submitting = false,
	title,
}: ArticleFormDialogProps) {
	const [dirtyState, setDirtyState] = useState({ dirty: false, formKey });
	const [discardConfirmState, setDiscardConfirmState] = useState({
		formKey,
		open: false,
	});
	const isDirty = dirtyState.formKey === formKey && dirtyState.dirty;
	const discardConfirmOpen =
		open && discardConfirmState.formKey === formKey && discardConfirmState.open;

	const closeDialog = useCallback(() => {
		setDiscardConfirmState({ formKey, open: false });
		onOpenChange(false);
	}, [formKey, onOpenChange]);

	const requestClose = useCallback(() => {
		if (submitting) {
			return;
		}

		if (isDirty) {
			setDiscardConfirmState({ formKey, open: true });
			return;
		}

		closeDialog();
	}, [closeDialog, formKey, isDirty, submitting]);

	const handleOpenChange = useCallback(
		(nextOpen: boolean) => {
			if (nextOpen) {
				onOpenChange(true);
				return;
			}

			requestClose();
		},
		[onOpenChange, requestClose],
	);
	const handleDirtyChange = useCallback(
		(dirty: boolean) => setDirtyState({ dirty, formKey }),
		[formKey],
	);
	const handleDiscardOpenChange = useCallback(
		(nextOpen: boolean) => setDiscardConfirmState({ formKey, open: nextOpen }),
		[formKey],
	);

	return (
		<>
			<Dialog.Root open={open} onOpenChange={handleOpenChange}>
				<Dialog.Portal>
					<Dialog.Overlay className={dialogOverlayClassName} />
					<Dialog.Content className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[var(--foreground0)] outline-none">
						<Dialog.Title className="sr-only">{title}</Dialog.Title>
						<div className="max-h-[calc(100svh-2rem)] w-full max-w-[64rem] overflow-y-auto">
							<ArticleForm
								article={article}
								error={error}
								hiking={hiking}
								key={formKey}
								onCancel={requestClose}
								onDirtyChange={handleDirtyChange}
								onSubmit={onSubmit}
								submitting={submitting}
							/>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
			<Dialog.Root
				open={discardConfirmOpen}
				onOpenChange={handleDiscardOpenChange}
			>
				<Dialog.Portal>
					<Dialog.Overlay className={dialogOverlayClassName} />
					<Dialog.Content className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[var(--foreground0)] outline-none">
						<div className="grid max-h-[calc(100svh-2rem)] w-full max-w-[28rem] gap-4 overflow-y-auto border border-[var(--peach)] bg-[var(--surface0)] p-5 shadow-[0.35rem_0.35rem_0_var(--background0)]">
							<div className="grid gap-2 border-[var(--overlay0)] border-b pb-3">
								<span className="font-mono text-[var(--peach)] text-sm">
									confirm.discard
								</span>
								<Dialog.Title className="m-0 text-[var(--foreground0)] text-xl leading-[1.2]">
									작성 중인 내용 닫기
								</Dialog.Title>
							</div>
							<Dialog.Description className="m-0 break-keep text-[var(--foreground1)] leading-[1.55]">
								변경사항이 저장되지 않습니다. 닫을까요?
							</Dialog.Description>
							<div className="flex flex-wrap justify-end gap-2 border-[var(--overlay0)] border-t pt-3">
								<Dialog.Close asChild>
									<button className={inlineButtonClassName} type="button">
										계속 작성
									</button>
								</Dialog.Close>
								<button
									className={`${inlineButtonClassName} !border-[var(--peach)] !text-[var(--peach)]`}
									onClick={closeDialog}
									type="button"
								>
									닫기
								</button>
							</div>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</>
	);
}
