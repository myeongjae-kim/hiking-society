'use client';

import * as Dialog from '@radix-ui/react-dialog';

import { dialogOverlayClassName, inlineButtonClassName } from './styles';

export type ConfirmState = {
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  title: string;
} | null;

type ConfirmDialogProps = {
  confirmState: ConfirmState;
  onOpenChange: (open: boolean) => void;
};

export function ConfirmDialog({ confirmState, onOpenChange }: ConfirmDialogProps) {
  return (
    <Dialog.Root open={confirmState !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlayClassName} />
        <Dialog.Content className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[var(--foreground0)] outline-none">
          <div className="grid max-h-[calc(100svh-2rem)] w-full max-w-[28rem] gap-4 overflow-y-auto border border-[var(--red)] bg-[var(--surface0)] p-5 shadow-[0.35rem_0.35rem_0_var(--background0)]">
            <div className="grid gap-2 border-b border-[var(--overlay0)] pb-3">
              <span className="font-mono text-sm text-[var(--red)]">confirm.delete</span>
              <Dialog.Title className="m-0 text-xl leading-[1.2] text-[var(--foreground0)]">
                {confirmState?.title ?? '삭제'}
              </Dialog.Title>
            </div>
            <Dialog.Description className="m-0 leading-[1.55] break-keep text-[var(--foreground1)]">
              {confirmState?.body}
            </Dialog.Description>
            <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--overlay0)] pt-3">
              <Dialog.Close asChild>
                <button className={inlineButtonClassName} type="button">
                  취소
                </button>
              </Dialog.Close>
              <button
                className={`${inlineButtonClassName} !border-[var(--red)] !text-[var(--red)]`}
                onClick={confirmState?.onConfirm}
                type="button"
              >
                {confirmState?.confirmLabel ?? '확인'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
