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

  const activeHikingForm = actions.dialogState.activeHikingForm;
  const activeArticleForm = actions.dialogState.activeArticleForm;
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
          <FeedIntroPanel
            onCreateHiking={() => actions.sectionActions.setActiveHikingForm({ type: 'create' })}
          />
          {articleLoader.groups.map((group, groupIndex) => (
            <FeedHikingSection
              actions={actions.sectionActions}
              currentUserId={currentUser.id}
              group={group}
              groupIndex={groupIndex}
              key={`${group.hiking.id}-${groupIndex}`}
              loader={{
                articlesByHikingId: articleLoader.articlesByHikingId,
                commentsByArticleId: articleLoader.commentsByArticleId,
                getHikingArticleCount: articleLoader.getHikingArticleCount,
                loadHikingArticles: articleLoader.loadHikingArticles,
                loadStateByHikingId: articleLoader.hikingArticleLoadStateById,
                registerHikingSection: articleLoader.registerHikingSection,
              }}
              state={actions.sectionState}
            />
          ))}
        </section>

        <StatusPanel
          articleCount={articleCount}
          commentCount={actions.statusState.visibleCommentCount}
          currentAuthorName={currentAuthorName}
          groupCount={articleLoader.groups.length}
          hikingCount={initialHikings.length}
        />
      </div>
      <FeedFooter
        articleCount={articleCount}
        commentCount={actions.statusState.visibleCommentCount}
        hikingCount={initialHikings.length}
      />
      <FeedDialogs
        actions={{
          ...actions.dialogActions,
          onConfirmOpenChange: (open) => !open && actions.dialogActions.setConfirmState(null),
        }}
        entities={{ activeArticle, activeArticleHiking, activeHiking }}
        state={actions.dialogState}
      />
    </main>
  );
}
