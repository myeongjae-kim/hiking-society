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
  entities: {
    activeArticle: Article | undefined;
    activeArticleHiking: Hiking | undefined;
    activeHiking: Hiking | undefined;
  };
  state: {
    activeArticleForm: ActiveArticleForm;
    activeArticleSubmitting: boolean;
    activeHikingForm: ActiveHikingForm;
    activeHikingSubmitting: boolean;
    confirmState: ConfirmState;
    errorByKey: Record<string, string>;
    loadingLabel: string | null;
    loadingOverlayOpen: boolean;
  };
  actions: {
    closeActiveArticleForm: () => void;
    closeActiveHikingForm: () => void;
    createArticle: (hikingId: HikingId, values: ArticleFormValues) => void;
    createHiking: (values: HikingFormValues) => void;
    onConfirmOpenChange: (open: boolean) => void;
    updateArticle: (articleId: Article['id'], values: ArticleFormValues) => void;
    updateHiking: (hikingId: HikingId, values: HikingFormValues) => void;
  };
};

export function FeedDialogs({ actions, entities, state }: FeedDialogsProps) {
  const activeHikingFormKey =
    state.activeHikingForm?.type === 'create'
      ? 'hiking-new'
      : state.activeHikingForm?.type === 'edit'
        ? `hiking-edit-${state.activeHikingForm.hikingId}`
        : null;
  const activeHikingFormTitle = state.activeHikingForm?.type === 'edit' ? '산행 수정' : '산행 등록';
  const hikingFormDialogOpen =
    state.activeHikingForm?.type === 'create' ||
    (state.activeHikingForm?.type === 'edit' && entities.activeHiking !== undefined);
  const activeArticleFormKey =
    state.activeArticleForm?.type === 'create'
      ? `article-new-${state.activeArticleForm.hikingId}`
      : state.activeArticleForm?.type === 'edit'
        ? `article-edit-${state.activeArticleForm.articleId}`
        : null;
  const activeArticleFormTitle = state.activeArticleForm?.type === 'edit' ? '글 수정' : '글 작성';
  const articleFormDialogOpen =
    state.activeArticleForm?.type === 'create' ||
    (state.activeArticleForm?.type === 'edit' && entities.activeArticle !== undefined);

  return (
    <>
      <ConfirmDialog confirmState={state.confirmState} onOpenChange={actions.onConfirmOpenChange} />
      <HikingFormDialog
        error={activeHikingFormKey ? state.errorByKey[activeHikingFormKey] : undefined}
        formKey={activeHikingFormKey ?? 'hiking-form'}
        hiking={entities.activeHiking}
        onCancel={actions.closeActiveHikingForm}
        onOpenChange={(open) => {
          if (!open) {
            actions.closeActiveHikingForm();
          }
        }}
        onSubmit={(values) => {
          if (state.activeHikingForm?.type === 'create') {
            actions.createHiking(values);
            return;
          }

          if (state.activeHikingForm?.type === 'edit') {
            actions.updateHiking(state.activeHikingForm.hikingId, values);
          }
        }}
        open={hikingFormDialogOpen}
        submitting={state.activeHikingSubmitting}
        title={activeHikingFormTitle}
      />
      <ArticleFormDialog
        article={entities.activeArticle}
        error={activeArticleFormKey ? state.errorByKey[activeArticleFormKey] : undefined}
        formKey={activeArticleFormKey ?? 'article-form'}
        hiking={entities.activeArticleHiking}
        onCancel={actions.closeActiveArticleForm}
        onOpenChange={(open) => {
          if (!open) {
            actions.closeActiveArticleForm();
          }
        }}
        onSubmit={(values) => {
          if (state.activeArticleForm?.type === 'create') {
            actions.createArticle(state.activeArticleForm.hikingId, values);
            return;
          }

          if (state.activeArticleForm?.type === 'edit') {
            actions.updateArticle(state.activeArticleForm.articleId, values);
          }
        }}
        open={articleFormDialogOpen}
        submitting={state.activeArticleSubmitting}
        title={activeArticleFormTitle}
      />
      <LoadingOverlay label={state.loadingLabel ?? undefined} open={state.loadingOverlayOpen} />
    </>
  );
}
