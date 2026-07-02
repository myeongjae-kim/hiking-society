'use client';

import * as Dialog from '@radix-ui/react-dialog';

import type { Article } from '@/core/article/domain';

import { ArticleForm } from './ArticleForm';
import type { ArticleFormValues } from './articleFormTypes';

type ArticleFormDialogProps = {
  article?: Article;
  error?: string;
  formKey: string;
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
  onCancel,
  onOpenChange,
  onSubmit,
  open,
  submitting = false,
  title,
}: ArticleFormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--background0)_68%,black)]" />
        <Dialog.Content className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[var(--foreground0)] outline-none">
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <div className="max-h-[calc(100svh-2rem)] w-full max-w-[48rem] overflow-y-auto">
            <ArticleForm
              article={article}
              error={error}
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
