'use client';

import { gridStackClassName } from '@/app/common/components/styles';
import { FeedFooter } from '@/app/feed/components/FeedFooter';
import { FeedTopbar } from '@/app/feed/components/FeedTopbar';
import { StatusPanel } from '@/app/feed/components/StatusPanel';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import type { NotificationListSnapshot } from '@/core/notification/model/Notification';
import { useMemo } from 'react';

import { useFeedArticleLoader } from '../hooks/useFeedArticleLoader';
import { useFeedCrudActions } from '../hooks/useFeedCrudActions';
import { getAuthorName } from '../utils/feed-crud-utils';
import { FeedDialogs } from './FeedDialogs';
import { FeedHikingSection } from './FeedHikingSection';
import { FeedIntroPanel } from './FeedIntroPanel';

type FeedCrudClientProps = {
  articleCount: number;
  commentCount: number;
  currentTheme: string;
  currentUser: AuthenticatedUser;
  hikingArticleCounts: readonly {
    articleCount: number;
    hikingId: HikingId;
  }[];
  hikings: readonly Hiking[];
  notificationSnapshot: NotificationListSnapshot;
  selectedHikingId: HikingId | null;
};

export function FeedCrudClient({
  articleCount,
  commentCount,
  currentTheme,
  currentUser,
  hikingArticleCounts,
  hikings: initialHikings,
  notificationSnapshot,
  selectedHikingId,
}: FeedCrudClientProps) {
  const currentAuthorName = useMemo(() => getAuthorName(currentUser), [currentUser]);
  const articleLoader = useFeedArticleLoader({
    hikingArticleCounts,
    hikings: initialHikings,
    selectedHikingId,
  });
  const actions = useFeedCrudActions({
    articleHikingIdByArticleId: articleLoader.articleHikingIdByArticleId,
    commentArticleIdByCommentId: articleLoader.commentArticleIdByCommentId,
    commentCount,
    getHikingArticleCount: articleLoader.getHikingArticleCount,
    selectedHikingId,
    setArticlesByHikingId: articleLoader.setArticlesByHikingId,
    setCommentsByHikingId: articleLoader.setCommentsByHikingId,
  });

  const activeHikingForm = actions.activeHikingForm;
  const activeArticleForm = actions.activeArticleForm;
  const activeHiking =
    activeHikingForm?.type === 'edit'
      ? initialHikings.find((hiking) => hiking.id === activeHikingForm.hikingId)
      : undefined;
  const activeArticle =
    activeArticleForm?.type === 'edit'
      ? articleLoader.loadedArticles.find((article) => article.id === activeArticleForm.articleId)
      : undefined;
  const activeArticleHiking =
    activeArticleForm?.type === 'create'
      ? initialHikings.find((hiking) => hiking.id === activeArticleForm.hikingId)
      : activeArticle
        ? initialHikings.find((hiking) => hiking.id === activeArticle.hikingId)
        : undefined;

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <FeedTopbar
        currentAuthorName={currentAuthorName}
        currentTheme={currentTheme}
        notificationSnapshot={notificationSnapshot}
        user={currentUser}
      />

      <div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 px-1.5 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
        <section className={gridStackClassName} aria-label="산행 글 피드">
          <FeedIntroPanel onCreateHiking={() => actions.setActiveHikingForm({ type: 'create' })} />
          {articleLoader.groups.map((group, groupIndex) => (
            <FeedHikingSection
              articlesByHikingId={articleLoader.articlesByHikingId}
              commentFormResetKeyByArticleId={actions.commentFormResetKeyByArticleId}
              commentsByArticleId={articleLoader.commentsByArticleId}
              currentUserId={currentUser.id}
              editingCommentId={actions.editingCommentId}
              errorByKey={actions.errorByKey}
              getHikingArticleCount={articleLoader.getHikingArticleCount}
              group={group}
              groupIndex={groupIndex}
              highlightedHikingId={actions.highlightedHikingId}
              isCommentCreateSubmitting={actions.isCommentCreateSubmitting}
              isCommentEditSubmitting={actions.isCommentEditSubmitting}
              isCommentLikePending={actions.isCommentLikePending}
              key={`${group.hiking.id}-${groupIndex}`}
              loadHikingArticles={articleLoader.loadHikingArticles}
              loadStateByHikingId={articleLoader.hikingArticleLoadStateById}
              onAddArticle={(hikingId) =>
                actions.setActiveArticleForm({ hikingId, type: 'create' })
              }
              onCopyArticleLink={actions.copyArticleLink}
              onCopyHikingLink={actions.copyHikingLink}
              onCreateComment={actions.createComment}
              onDeleteArticle={actions.requestDeleteArticle}
              onDeleteComment={actions.requestDeleteComment}
              onDeleteHiking={actions.requestDeleteHiking}
              onEditArticle={(articleId) =>
                actions.setActiveArticleForm({ articleId, type: 'edit' })
              }
              onEditComment={actions.setEditingCommentId}
              onEditHiking={(hikingId) => actions.setActiveHikingForm({ hikingId, type: 'edit' })}
              onReplyComment={actions.setReplyingCommentId}
              onSubmitCommentEdit={actions.updateComment}
              onToggleArticleLike={actions.toggleArticleLike}
              onToggleCommentLike={actions.toggleCommentLike}
              pendingLikeByKey={actions.pendingLikeByKey}
              registerHikingSection={articleLoader.registerHikingSection}
              replyingCommentId={actions.replyingCommentId}
            />
          ))}
        </section>

        <StatusPanel
          articleCount={articleCount}
          commentCount={actions.visibleCommentCount}
          currentAuthorName={currentAuthorName}
          groupCount={articleLoader.groups.length}
          hikingCount={initialHikings.length}
        />
      </div>
      <FeedFooter
        articleCount={articleCount}
        commentCount={actions.visibleCommentCount}
        hikingCount={initialHikings.length}
      />
      <FeedDialogs
        activeArticle={activeArticle}
        activeArticleForm={actions.activeArticleForm}
        activeArticleHiking={activeArticleHiking}
        activeArticleSubmitting={actions.activeArticleSubmitting}
        activeHiking={activeHiking}
        activeHikingForm={actions.activeHikingForm}
        activeHikingSubmitting={actions.activeHikingSubmitting}
        confirmState={actions.confirmState}
        errorByKey={actions.errorByKey}
        loadingLabel={actions.loadingLabel}
        loadingOverlayOpen={actions.loadingOverlayOpen}
        onCloseArticleForm={actions.closeActiveArticleForm}
        onCloseHikingForm={actions.closeActiveHikingForm}
        onConfirmOpenChange={(open) => !open && actions.setConfirmState(null)}
        onCreateArticle={actions.createArticle}
        onCreateHiking={actions.createHiking}
        onUpdateArticle={actions.updateArticle}
        onUpdateHiking={actions.updateHiking}
      />
    </main>
  );
}
