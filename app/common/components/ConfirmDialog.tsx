'use client';

import * as Dialog from '@radix-ui/react-dialog';

import { inlineButtonClassName } from './styles';

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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--background0)_78%,black)]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 z-50 grid w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 gap-4 bg-[var(--surface0)] !p-5 text-[var(--foreground0)] outline-none [--box-border-color:var(--overlay0)] [--box-border-width:1px]"
          box-="round"
        >
          <Dialog.Title className="m-0 text-xl text-[var(--red)]">
            {confirmState?.title ?? '삭제'}
          </Dialog.Title>
          <Dialog.Description className="m-0 leading-[1.5] text-[var(--foreground1)]">
            {confirmState?.body}
          </Dialog.Description>
          <div className="flex flex-wrap justify-end gap-2">
            <Dialog.Close asChild>
              <button className={inlineButtonClassName} type="button">
                취소
              </button>
            </Dialog.Close>
            <button
              className={`${inlineButtonClassName} !text-[var(--red)]`}
              onClick={confirmState?.onConfirm}
              type="button"
            >
              {confirmState?.confirmLabel ?? '확인'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
