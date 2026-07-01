import type { ReactNode } from 'react';

import type { Article, ArticleId } from '@/core/article/domain';
import type { Comment } from '@/core/comment/domain';
import type { Hiking } from '@/core/hiking/domain';
import { mockArticles, mockComments, mockHikings } from '@/core/mock';
import { PhotoViewer } from './photo-viewer';

type FeedGroup = {
  articles: Article[];
  hiking: Hiking;
};

const commandClassName = 'm-0 font-mono text-sm leading-[1.4] text-[var(--mauve)]';
const gridStackClassName = 'grid min-w-0 gap-4';
const boxBorderClassName = '[--box-border-color:var(--overlay0)] [--box-border-width:1px]';

function compareDesc(left: string, right: string) {
  return right.localeCompare(left);
}

function getFeedGroups(): FeedGroup[] {
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

function Command({ children }: { children: ReactNode }) {
  return (
    <p className={commandClassName}>
      <span className="text-[var(--peach)]">$ </span>
      {children}
    </p>
  );
}

function HikingHeader({ hiking }: { hiking: Hiking }) {
  return (
    <>
      <header className="sticky top-2 z-20 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-4 py-3 shadow-[0_0.35rem_0_var(--background0)]">
        <h2 className="m-0 text-[1.75rem] leading-[1.1] tracking-normal text-[var(--blue)]">
          {hiking.mountainName}
        </h2>
        <span className="text-[var(--yellow)]">{formatDateLabel(hiking.hikingDate)}</span>
      </header>
      <div className="border border-t-0 border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--surface0)_68%,transparent)] px-4 pt-2.5 pb-3">
        <p className="mt-1 mb-0 font-mono text-sm leading-[1.45] [overflow-wrap:anywhere] text-[var(--foreground1)]">
          {getHikingMeta(hiking).join('  ')}
        </p>
        <p className="mt-1 mb-0 font-mono text-sm leading-[1.45] [overflow-wrap:anywhere] text-[var(--foreground1)]">
          members={hiking.participantsCsv}
        </p>
        <p className="mt-1 mb-0 font-mono text-sm leading-[1.45] [overflow-wrap:anywhere] text-[var(--foreground1)]">
          restaurant={hiking.restaurantAddress ?? 'null'}
        </p>
      </div>
    </>
  );
}

function ArticlePanel({ article, comments }: { article: Article; comments: readonly Comment[] }) {
  const { repliesByParentId, topLevelComments } = getThreadedComments(comments);

  return (
    <article
      className={`grid min-w-0 gap-5 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-5 [contain-intrinsic-size:auto_48rem] [content-visibility:auto] ${boxBorderClassName}`}
      box-="round"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Command>article.open {article.id}</Command>
          <h3 className="mt-1 mb-0 text-xl leading-[1.2] tracking-normal text-[var(--foreground0)]">
            {article.authorName}
          </h3>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5 font-mono text-sm text-[var(--subtext0)]">
          <span className="border border-[var(--overlay0)] bg-[var(--surface0)] px-2">
            {formatTimeLabel(article.createdAt)}
          </span>
          {article.edited ? (
            <span className="border border-[var(--overlay0)] bg-[var(--surface0)] px-2">
              edited
            </span>
          ) : null}
        </div>
      </header>

      <PhotoViewer articleId={article.id} authorName={article.authorName} photos={article.photos} />

      <p className="m-0 text-[1.05rem] leading-[1.6] break-keep text-[var(--foreground0)]">
        {article.body}
      </p>

      <section
        className="grid gap-3 border-t border-[var(--overlay0)] pt-3.5"
        aria-label={`${article.authorName} 게시글 댓글`}
      >
        <Command>comments.list --count={comments.length}</Command>
        {topLevelComments.map((comment) => (
          <div className="grid min-w-0 gap-1.5" key={comment.id}>
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
    <div
      className={`grid min-w-0 grid-cols-[auto_auto_minmax(0,1fr)] items-baseline gap-2 text-[0.95rem] leading-[1.45] ${
        reply ? 'ml-4 text-[var(--subtext0)]' : 'text-[var(--foreground1)]'
      }`}
    >
      <span className="font-mono text-[var(--green)]">{prompt}</span>
      <span className="whitespace-nowrap text-[var(--pink)]">{comment.authorName}</span>
      <span className="min-w-0 [overflow-wrap:anywhere]">{comment.body}</span>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dotted border-[var(--overlay0)] pb-1.5">
      <dt className="m-0 text-[var(--subtext0)]">{label}</dt>
      <dd className="m-0 text-[var(--green)]">{value}</dd>
    </div>
  );
}

function StatusPanel({ groupCount }: { groupCount: number }) {
  return (
    <aside
      className={`grid gap-4 self-start bg-[var(--surface0)] !p-5 lg:![position:sticky] lg:top-2 ${boxBorderClassName}`}
      box-="round"
      aria-label="피드 상태"
    >
      <Command>status --mock</Command>
      <dl className="m-0 grid gap-2">
        <StatusRow label="groups" value={groupCount} />
        <StatusRow label="hikings" value={mockHikings.length} />
        <StatusRow label="articles" value={mockArticles.length} />
        <StatusRow label="comments" value={mockComments.length} />
      </dl>
    </aside>
  );
}

export default function FeedPage() {
  const groups = getFeedGroups();
  const commentsByArticleId = getCommentsByArticleId();

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--background0)_92%,transparent)] px-4 py-2">
        <div>
          <Command>Hiking Society /feed</Command>
        </div>
      </header>

      <div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
        <section className={gridStackClassName} aria-label="산행 게시글 피드">
          {groups.map((group, groupIndex) => (
            <section
              className={gridStackClassName}
              key={`${group.hiking.id}-${groupIndex}`}
              aria-labelledby={`hiking-${group.hiking.id}`}
            >
              <HikingHeader hiking={group.hiking} />
              <div className={gridStackClassName}>
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

        <StatusPanel groupCount={groups.length} />
      </div>
    </main>
  );
}
