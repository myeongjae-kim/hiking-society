'use client';

import { ArticleFormDialog } from '@/app/article/components/ArticleFormDialog';
import type { ArticleFormValues } from '@/app/article/components/articleFormTypes';
import { ConfirmDialog, type ConfirmState } from '@/app/common/components/ConfirmDialog';
import { LoadingOverlay } from '@/app/common/components/LoadingOverlay';
import { HikingFormDialog } from '@/app/hiking/components/HikingFormDialog';
import type { HikingFormValues } from '@/app/hiking/components/hikingFormTypes';
import type { Article } from '@/core/article/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';

import type { ActiveArticleForm, ActiveHikingForm } from '../utils/feedCrudTypes';

type FeedDialogsProps = {
  activeArticle: Article | undefined;
  activeArticleForm: ActiveArticleForm;
  activeArticleHiking: Hiking | undefined;
  activeArticleSubmitting: boolean;
  activeHiking: Hiking | undefined;
  activeHikingForm: ActiveHikingForm;
  activeHikingSubmitting: boolean;
  confirmState: ConfirmState;
  errorByKey: Record<string, string>;
  loadingLabel: string | null;
  loadingOverlayOpen: boolean;
  onCloseArticleForm: () => void;
  onCloseHikingForm: () => void;
  onConfirmOpenChange: (open: boolean) => void;
  onCreateArticle: (hikingId: HikingId, values: ArticleFormValues) => void;
  onCreateHiking: (values: HikingFormValues) => void;
  onUpdateArticle: (articleId: Article['id'], values: ArticleFormValues) => void;
  onUpdateHiking: (hikingId: HikingId, values: HikingFormValues) => void;
};

export function FeedDialogs({
  activeArticle,
  activeArticleForm,
  activeArticleHiking,
  activeArticleSubmitting,
  activeHiking,
  activeHikingForm,
  activeHikingSubmitting,
  confirmState,
  errorByKey,
  loadingLabel,
  loadingOverlayOpen,
  onCloseArticleForm,
  onCloseHikingForm,
  onConfirmOpenChange,
  onCreateArticle,
  onCreateHiking,
  onUpdateArticle,
  onUpdateHiking,
}: FeedDialogsProps) {
  const activeHikingFormKey =
    activeHikingForm?.type === 'create'
      ? 'hiking-new'
      : activeHikingForm?.type === 'edit'
        ? `hiking-edit-${activeHikingForm.hikingId}`
        : null;
  const activeHikingFormTitle = activeHikingForm?.type === 'edit' ? '산행 수정' : '산행 등록';
  const hikingFormDialogOpen =
    activeHikingForm?.type === 'create' ||
    (activeHikingForm?.type === 'edit' && activeHiking !== undefined);
  const activeArticleFormKey =
    activeArticleForm?.type === 'create'
      ? `article-new-${activeArticleForm.hikingId}`
      : activeArticleForm?.type === 'edit'
        ? `article-edit-${activeArticleForm.articleId}`
        : null;
  const activeArticleFormTitle = activeArticleForm?.type === 'edit' ? '글 수정' : '글 작성';
  const articleFormDialogOpen =
    activeArticleForm?.type === 'create' ||
    (activeArticleForm?.type === 'edit' && activeArticle !== undefined);

  return (
    <>
      <ConfirmDialog confirmState={confirmState} onOpenChange={onConfirmOpenChange} />
      <HikingFormDialog
        error={activeHikingFormKey ? errorByKey[activeHikingFormKey] : undefined}
        formKey={activeHikingFormKey ?? 'hiking-form'}
        hiking={activeHiking}
        onCancel={onCloseHikingForm}
        onOpenChange={(open) => {
          if (!open) {
            onCloseHikingForm();
          }
        }}
        onSubmit={(values) => {
          if (activeHikingForm?.type === 'create') {
            onCreateHiking(values);
            return;
          }

          if (activeHikingForm?.type === 'edit') {
            onUpdateHiking(activeHikingForm.hikingId, values);
          }
        }}
        open={hikingFormDialogOpen}
        submitting={activeHikingSubmitting}
        title={activeHikingFormTitle}
      />
      <ArticleFormDialog
        article={activeArticle}
        error={activeArticleFormKey ? errorByKey[activeArticleFormKey] : undefined}
        formKey={activeArticleFormKey ?? 'article-form'}
        hiking={activeArticleHiking}
        onCancel={onCloseArticleForm}
        onOpenChange={(open) => {
          if (!open) {
            onCloseArticleForm();
          }
        }}
        onSubmit={(values) => {
          if (activeArticleForm?.type === 'create') {
            onCreateArticle(activeArticleForm.hikingId, values);
            return;
          }

          if (activeArticleForm?.type === 'edit') {
            onUpdateArticle(activeArticleForm.articleId, values);
          }
        }}
        open={articleFormDialogOpen}
        submitting={activeArticleSubmitting}
        title={activeArticleFormTitle}
      />
      <LoadingOverlay label={loadingLabel ?? undefined} open={loadingOverlayOpen} />
    </>
  );
}
