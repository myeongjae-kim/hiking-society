import Link from 'next/link';

import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment } from '@/core/comment/domain';
import type { Hiking } from '@/core/hiking/domain';
import { mockArticles, mockComments, mockHikings } from '@/core/mock';
import { PhotoViewer } from './photo-viewer';

type FeedSort = 'hiking' | 'article';

type SearchParams = Promise<{
  sort?: string | string[];
}>;

type FeedGroup = {
  articles: Article[];
  hiking: Hiking;
};

const sortLabels = {
  article: '게시글',
  hiking: '등산',
} satisfies Record<FeedSort, string>;

const sortOptions: FeedSort[] = ['hiking', 'article'];

function normalizeSort(sort: string | string[] | undefined): FeedSort {
  const sortValue = Array.isArray(sort) ? sort[0] : sort;

  return sortValue === 'article' ? 'article' : 'hiking';
}

function compareDesc(left: string, right: string) {
  return right.localeCompare(left);
}

function createIndexById<T extends { id: string }>(items: readonly T[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function getFeedGroups(sort: FeedSort): FeedGroup[] {
  const hikingById = createIndexById(mockHikings);

  if (sort === 'hiking') {
    return [...mockHikings]
      .sort((left, right) => compareDesc(left.hikingDate, right.hikingDate))
      .map((hiking) => ({
        articles: mockArticles
          .filter((article) => article.hikingId === hiking.id)
          .sort((left, right) => compareDesc(left.createdAt, right.createdAt)),
        hiking,
      }))
      .filter((group) => group.articles.length > 0);
  }

  const groups: FeedGroup[] = [];

  for (const article of [...mockArticles].sort((left, right) =>
    compareDesc(left.createdAt, right.createdAt),
  )) {
    const hiking = hikingById.get(article.hikingId);

    if (!hiking) {
      continue;
    }

    const lastGroup = groups.at(-1);

    if (lastGroup?.hiking.id === hiking.id) {
      lastGroup.articles.push(article);
      continue;
    }

    groups.push({
      articles: [article],
      hiking,
    });
  }

  return groups;
}

function getCommentsByArticleId() {
  const commentsByArticleId = new Map<ArticleId, Comment[]>();

  for (const comment of mockComments) {
    const comments = commentsByArticleId.get(comment.articleId) ?? [];
    comments.push(comment);
    commentsByArticleId.set(comment.articleId, comments);
  }

  return commentsByArticleId;
}

function getThreadedComments(comments: readonly Comment[]) {
  const repliesByParentId = new Map<Comment['id'], Comment[]>();
  const topLevelComments: Comment[] = [];

  for (const comment of comments) {
    if (comment.parentCommentId === null) {
      topLevelComments.push(comment);
      continue;
    }

    const replies = repliesByParentId.get(comment.parentCommentId) ?? [];
    replies.push(comment);
    repliesByParentId.set(comment.parentCommentId, replies);
  }

  return {
    repliesByParentId,
    topLevelComments,
  };
}

function formatDateLabel(value: string) {
  return value;
}

function formatTimeLabel(value: string) {
  return value.slice(11, 16);
}

function getHikingMeta(hiking: Hiking) {
  return [
    `date=${formatDateLabel(hiking.hikingDate)}`,
    `tz=${hiking.timezone}`,
    `start=${formatTimeLabel(hiking.startedAt)}`,
    `done=${formatTimeLabel(hiking.completedAt)}`,
    `lat=${hiking.latitude}`,
    `lng=${hiking.longitude}`,
  ];
}

function getArticleComments(commentsByArticleId: Map<ArticleId, Comment[]>, articleId: ArticleId) {
  return [...(commentsByArticleId.get(articleId) ?? [])].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

function SortLink({ activeSort, sort }: { activeSort: FeedSort; sort: FeedSort }) {
  const isActive = activeSort === sort;

  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={`feed-sort-link ${isActive ? 'feed-sort-link-active' : ''}`}
      href={sort === 'hiking' ? '/feed' : `/feed?sort=${sort}`}
    >
      {sortLabels[sort]}
    </Link>
  );
}

function HikingHeader({ hiking }: { hiking: Hiking }) {
  return (
    <>
      <header className="feed-hiking-sticky">
        <h2>{hiking.mountainName}</h2>
        <span>{formatDateLabel(hiking.hikingDate)}</span>
      </header>
      <div className="feed-hiking-details">
        <p className="feed-hiking-meta">{getHikingMeta(hiking).join('  ')}</p>
        <p className="feed-hiking-meta">members={hiking.participantsCsv}</p>
        <p className="feed-hiking-meta">restaurant={hiking.restaurantAddress ?? 'null'}</p>
      </div>
    </>
  );
}

function ArticlePanel({ article, comments }: { article: Article; comments: readonly Comment[] }) {
  const { repliesByParentId, topLevelComments } = getThreadedComments(comments);

  return (
    <article className="feed-article" box-="round">
      <header className="feed-article-header">
        <div>
          <p className="feed-command">article.open {article.id}</p>
          <h3>{article.authorName}</h3>
        </div>
        <div className="feed-article-status">
          <span>{formatTimeLabel(article.createdAt)}</span>
          {article.edited ? <span>edited</span> : null}
        </div>
      </header>

      <PhotoViewer articleId={article.id} authorName={article.authorName} photos={article.photos} />

      <p className="feed-article-body">{article.body}</p>

      <section className="feed-comments" aria-label={`${article.authorName} 게시글 댓글`}>
        <p className="feed-command">comments.list --count={comments.length}</p>
        {topLevelComments.map((comment) => (
          <div className="feed-comment-thread" key={comment.id}>
            <CommentLine comment={comment} prompt="comment>" />
            {(repliesByParentId.get(comment.id) ?? []).map((reply) => (
              <CommentLine comment={reply} key={reply.id} prompt="reply>" reply />
            ))}
          </div>
        ))}
      </section>
    </article>
  );
}

function CommentLine({
  comment,
  prompt,
  reply,
}: {
  comment: Comment;
  prompt: string;
  reply?: boolean;
}) {
  return (
    <div className={`feed-comment ${reply ? 'feed-comment-reply' : ''}`}>
      <span className="feed-comment-prompt">{prompt}</span>
      <span className="feed-comment-author">{comment.authorName}</span>
      <span className="feed-comment-body">{comment.body}</span>
    </div>
  );
}

function StatusPanel({ groupCount, sort }: { groupCount: number; sort: FeedSort }) {
  return (
    <aside className="feed-status-panel" box-="round" aria-label="피드 상태">
      <p className="feed-command">status --mock</p>
      <dl>
        <div>
          <dt>sort</dt>
          <dd>{sortLabels[sort]}</dd>
        </div>
        <div>
          <dt>groups</dt>
          <dd>{groupCount}</dd>
        </div>
        <div>
          <dt>hikings</dt>
          <dd>{mockHikings.length}</dd>
        </div>
        <div>
          <dt>articles</dt>
          <dd>{mockArticles.length}</dd>
        </div>
        <div>
          <dt>comments</dt>
          <dd>{mockComments.length}</dd>
        </div>
      </dl>
    </aside>
  );
}

export default async function FeedPage({ searchParams }: { searchParams: SearchParams }) {
  const sort = normalizeSort((await searchParams).sort);
  const groups = getFeedGroups(sort);
  const commentsByArticleId = getCommentsByArticleId();

  return (
    <main className="feed-shell">
      <header className="feed-topbar">
        <div>
          <p className="feed-command">Hiking Society /feed</p>
        </div>
        <nav className="feed-sort-nav" aria-label="피드 정렬">
          {sortOptions.map((sortOption) => (
            <SortLink activeSort={sort} key={sortOption} sort={sortOption} />
          ))}
        </nav>
      </header>

      <div className="feed-layout">
        <section className="feed-stream" aria-label="산행 게시글 피드">
          {groups.map((group, groupIndex) => (
            <section
              className="feed-hiking-group"
              key={`${group.hiking.id}-${groupIndex}`}
              aria-labelledby={`hiking-${group.hiking.id}`}
            >
              <HikingHeader hiking={group.hiking} />
              <div className="feed-article-list">
                {group.articles.map((article) => (
                  <ArticlePanel
                    article={article}
                    comments={getArticleComments(commentsByArticleId, article.id)}
                    key={article.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </section>

        <StatusPanel groupCount={groups.length} sort={sort} />
      </div>
    </main>
  );
}
