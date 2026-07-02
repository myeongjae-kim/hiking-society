'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import { useMemo, useState } from 'react';

import type { Article, ArticleId, ArticlePhoto } from '@/core/article/domain';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';
import { roleLabels } from '@/core/auth/model/roleLabels';
import type { Comment, CommentId } from '@/core/comment/domain';
import type {
  AuthorName,
  IsoDateString,
  IsoDateTimeString,
  Latitude,
  Longitude,
  Timezone,
} from '@/core/common/domain';
import type { Hiking, HikingId } from '@/core/hiking/domain';
import { DateTimeLabel } from './date-time-label';
import { PhotoViewer } from './photo-viewer';

type FeedCrudClientProps = {
  articles: readonly Article[];
  comments: readonly Comment[];
  currentUser: AuthenticatedUser;
  hikings: readonly Hiking[];
};

type FeedGroup = {
  articles: Article[];
  hiking: Hiking;
};

type HikingFormValues = {
  completedTime: string;
  hikingDate: string;
  latitude: string;
  longitude: string;
  mountainName: string;
  participantsCsv: string;
  restaurantAddress: string;
  startedTime: string;
  timezone: string;
};

type ArticleFormValues = {
  body: string;
  photos: DraftPhoto[];
};

type DraftPhoto = ArticlePhoto & {
  readonly fileName: string;
};

type ConfirmState = {
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  title: string;
} | null;

const commandClassName = 'm-0 font-mono text-sm leading-[1.4] text-[var(--mauve)]';
const gridStackClassName = 'grid min-w-0 gap-4';
const boxBorderClassName = '[--box-border-color:var(--overlay0)] [--box-border-width:1px]';
const fieldClassName =
  'min-w-0 border border-[var(--overlay0)] bg-[var(--background1)] px-2 py-1.5 text-[var(--foreground0)]';
const labelClassName = 'grid min-w-0 gap-1.5 text-sm leading-[1.35] text-[var(--subtext0)]';
const inlineButtonClassName =
  'inline-flex !h-auto !min-h-[1.75rem] items-center justify-center !border !border-[var(--overlay0)] !bg-[var(--surface0)] !bg-none px-3 py-1 font-mono !text-sm leading-[1.2] whitespace-nowrap !text-[var(--foreground0)] no-underline hover:!bg-[var(--surface1)] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)] active:!bg-[var(--surface2)] active:!text-[var(--foreground0)]';
const hiddenFileInputClassName = 'sr-only';
const thumbnailUrl = '/thumbnail.webp';
const defaultTimezone = 'Asia/Seoul';

function compareDesc(left: string, right: string) {
  return right.localeCompare(left);
}

function nowIso() {
  return new Date().toISOString() as IsoDateTimeString;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function getAuthorName(user: AuthenticatedUser) {
  return (user.displayName ?? user.name ?? user.email ?? '회원') as AuthorName;
}

function getTimeValue(value: string) {
  return value.slice(11, 16);
}

function makeDateTime(date: string, time: string, timezone: string) {
  const offset = timezone === 'Asia/Seoul' ? '+09:00' : '';
  return `${date}T${time || '00:00'}:00${offset}` as IsoDateTimeString;
}

function getHikingFormDefaults(hiking?: Hiking): HikingFormValues {
  return {
    completedTime: hiking ? getTimeValue(hiking.completedAt) : '',
    hikingDate: hiking?.hikingDate ?? todayIsoDate(),
    latitude: hiking ? String(hiking.latitude) : '',
    longitude: hiking ? String(hiking.longitude) : '',
    mountainName: hiking?.mountainName ?? '',
    participantsCsv: hiking?.participantsCsv ?? '',
    restaurantAddress: hiking?.restaurantAddress ?? '',
    startedTime: hiking ? getTimeValue(hiking.startedAt) : '',
    timezone: hiking?.timezone ?? defaultTimezone,
  };
}

function isOwn(authorName: AuthorName, currentAuthorName: AuthorName) {
  return authorName === currentAuthorName;
}

function getFeedGroups(hikings: readonly Hiking[], articles: readonly Article[]): FeedGroup[] {
  return [...hikings]
    .sort((left, right) => compareDesc(left.hikingDate, right.hikingDate))
    .map((hiking) => ({
      articles: articles
        .filter((article) => article.hikingId === hiking.id && article.deletedAt === null)
        .sort((left, right) => compareDesc(left.createdAt, right.createdAt)),
      hiking,
    }));
}

function getCommentsByArticleId(comments: readonly Comment[]) {
  const commentsByArticleId = new Map<ArticleId, Comment[]>();

  for (const comment of comments) {
    const articleComments = commentsByArticleId.get(comment.articleId) ?? [];
    articleComments.push(comment);
    commentsByArticleId.set(comment.articleId, articleComments);
  }

  return commentsByArticleId;
}

function getThreadedComments(comments: readonly Comment[]) {
  const repliesByParentId = new Map<CommentId, Comment[]>();
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

function getArticleComments(commentsByArticleId: Map<ArticleId, Comment[]>, articleId: ArticleId) {
  return [...(commentsByArticleId.get(articleId) ?? [])].sort((left, right) =>
    left.createdAt.localeCompare(right.createdAt),
  );
}

function getVisibleCommentCount(comments: readonly Comment[]) {
  return comments.filter((comment) => comment.deletedAt === null).length;
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

function getArticleMeta(article: Article, commentCount: number) {
  return [
    `@${article.authorName}`,
    <DateTimeLabel key={`${article.id}-created-at`} value={article.createdAt} />,
    `${article.photos.length} photos`,
    `${commentCount} comments`,
    ...(article.edited ? ['edited'] : []),
  ];
}

function Command({ children }: { children: ReactNode }) {
  return (
    <p className={commandClassName}>
      <span className="text-[var(--peach)]">$ </span>
      {children}
    </p>
  );
}

function InlineMeta({ items }: { items: readonly ReactNode[] }) {
  return (
    <p className="m-0 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-sm leading-[1.45] text-[var(--subtext0)]">
      {items.map((item, index) => (
        <span className="inline-flex items-center gap-x-2" key={index}>
          {index > 0 ? (
            <span aria-hidden="true" className="text-[var(--overlay1)]">
              ·
            </span>
          ) : null}
          <span className={index === 0 ? 'text-[var(--pink)]' : undefined}>{item}</span>
        </span>
      ))}
    </p>
  );
}

function ActionButton({
  children,
  onClick,
  tone,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'danger';
  type?: 'button' | 'submit';
}) {
  return (
    <button
      className={`${inlineButtonClassName} ${tone === 'danger' ? '!text-[var(--red)]' : ''}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className={labelClassName}>
      <span>{label}</span>
      {children}
    </label>
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

function parseExifGpsCoordinate(values: number[], reference: string) {
  const [degrees = 0, minutes = 0, seconds = 0] = values;
  const sign = reference === 'S' || reference === 'W' ? -1 : 1;
  return sign * (degrees + minutes / 60 + seconds / 3600);
}

function readAscii(view: DataView, offset: number, count: number) {
  let value = '';

  for (let index = 0; index < count; index += 1) {
    const charCode = view.getUint8(offset + index);

    if (charCode !== 0) {
      value += String.fromCharCode(charCode);
    }
  }

  return value;
}

function getRational(view: DataView, offset: number, littleEndian: boolean) {
  const numerator = view.getUint32(offset, littleEndian);
  const denominator = view.getUint32(offset + 4, littleEndian);
  return denominator === 0 ? 0 : numerator / denominator;
}

function getExifEntryValueOffset(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  valueSize: number,
  littleEndian: boolean,
) {
  if (valueSize <= 4) {
    return entryOffset + 8;
  }

  return tiffStart + view.getUint32(entryOffset + 8, littleEndian);
}

function findExifSegment(view: DataView) {
  let offset = 2;

  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) {
      return null;
    }

    const marker = view.getUint8(offset + 1);
    const segmentLength = view.getUint16(offset + 2, false);

    if (marker === 0xe1 && readAscii(view, offset + 4, 6) === 'Exif') {
      return offset + 10;
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function parseExifGps(arrayBuffer: ArrayBuffer) {
  const view = new DataView(arrayBuffer);

  if (view.byteLength < 4 || view.getUint16(0, false) !== 0xffd8) {
    return null;
  }

  const tiffStart = findExifSegment(view);

  if (tiffStart === null) {
    return null;
  }

  const byteOrder = readAscii(view, tiffStart, 2);
  const littleEndian = byteOrder === 'II';

  if (!littleEndian && byteOrder !== 'MM') {
    return null;
  }

  const firstIfdOffset = tiffStart + view.getUint32(tiffStart + 4, littleEndian);
  const entryCount = view.getUint16(firstIfdOffset, littleEndian);
  let gpsIfdOffset: number | null = null;

  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = firstIfdOffset + 2 + index * 12;
    const tag = view.getUint16(entryOffset, littleEndian);

    if (tag === 0x8825) {
      gpsIfdOffset = tiffStart + view.getUint32(entryOffset + 8, littleEndian);
      break;
    }
  }

  if (gpsIfdOffset === null) {
    return null;
  }

  const gpsEntryCount = view.getUint16(gpsIfdOffset, littleEndian);
  let latitudeRef = '';
  let longitudeRef = '';
  let latitudeValues: number[] | null = null;
  let longitudeValues: number[] | null = null;

  for (let index = 0; index < gpsEntryCount; index += 1) {
    const entryOffset = gpsIfdOffset + 2 + index * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const count = view.getUint32(entryOffset + 4, littleEndian);

    if ((tag === 1 || tag === 3) && type === 2) {
      const valueOffset = getExifEntryValueOffset(
        view,
        tiffStart,
        entryOffset,
        count,
        littleEndian,
      );
      const value = readAscii(view, valueOffset, count);

      if (tag === 1) {
        latitudeRef = value;
      } else {
        longitudeRef = value;
      }
    }

    if ((tag === 2 || tag === 4) && type === 5) {
      const valueOffset = getExifEntryValueOffset(
        view,
        tiffStart,
        entryOffset,
        count * 8,
        littleEndian,
      );
      const values = Array.from({ length: count }, (_, valueIndex) =>
        getRational(view, valueOffset + valueIndex * 8, littleEndian),
      );

      if (tag === 2) {
        latitudeValues = values;
      } else {
        longitudeValues = values;
      }
    }
  }

  if (!latitudeRef || !longitudeRef || !latitudeValues || !longitudeValues) {
    return null;
  }

  return {
    latitude: parseExifGpsCoordinate(latitudeValues, latitudeRef),
    longitude: parseExifGpsCoordinate(longitudeValues, longitudeRef),
  };
}

async function readGpsFromFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return parseExifGps(arrayBuffer);
}

function HikingForm({
  error,
  hiking,
  onCancel,
  onSubmit,
}: {
  error?: string;
  hiking?: Hiking;
  onCancel: () => void;
  onSubmit: (values: HikingFormValues) => void;
}) {
  const [values, setValues] = useState(() => getHikingFormDefaults(hiking));
  const [gpsStatus, setGpsStatus] = useState('EXIF 좌표를 읽을 사진을 선택하세요.');

  const updateValue = (key: keyof HikingFormValues, value: string) => {
    setValues((currentValues) => ({
      ...currentValues,
      [key]: value,
    }));
  };

  const handleGpsFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    setGpsStatus('EXIF 좌표를 읽는 중...');

    try {
      const gps = await readGpsFromFile(file);

      if (!gps) {
        setGpsStatus('이 사진에서 EXIF 위경도를 찾지 못했습니다.');
        return;
      }

      setValues((currentValues) => ({
        ...currentValues,
        latitude: gps.latitude.toFixed(6),
        longitude: gps.longitude.toFixed(6),
      }));
      setGpsStatus(`${file.name}에서 좌표를 반영했습니다.`);
    } catch {
      setGpsStatus('EXIF 좌표를 읽지 못했습니다.');
    } finally {
      input.value = '';
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      className={`grid gap-4 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
      box-="round"
      onSubmit={handleSubmit}
    >
      <Command>{hiking ? `산행 수정: ${hiking.id}` : '산행 등록'}</Command>
      <div className="grid gap-3 sm:grid-cols-2">
        <FieldLabel label="산 이름">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('mountainName', event.currentTarget.value)}
            required
            value={values.mountainName}
          />
        </FieldLabel>
        <FieldLabel label="산행 날짜">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('hikingDate', event.currentTarget.value)}
            required
            type="date"
            value={values.hikingDate}
          />
        </FieldLabel>
        <FieldLabel label="타임존">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('timezone', event.currentTarget.value)}
            required
            value={values.timezone}
          />
        </FieldLabel>
        <FieldLabel label="참석자 CSV">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('participantsCsv', event.currentTarget.value)}
            required
            value={values.participantsCsv}
          />
        </FieldLabel>
        <FieldLabel label="출발 시각">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('startedTime', event.currentTarget.value)}
            required
            type="time"
            value={values.startedTime}
          />
        </FieldLabel>
        <FieldLabel label="하산 완료 시각">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('completedTime', event.currentTarget.value)}
            required
            type="time"
            value={values.completedTime}
          />
        </FieldLabel>
        <FieldLabel label="위도">
          <input
            className={fieldClassName}
            inputMode="decimal"
            onChange={(event) => updateValue('latitude', event.currentTarget.value)}
            required
            value={values.latitude}
          />
        </FieldLabel>
        <FieldLabel label="경도">
          <input
            className={fieldClassName}
            inputMode="decimal"
            onChange={(event) => updateValue('longitude', event.currentTarget.value)}
            required
            value={values.longitude}
          />
        </FieldLabel>
        <FieldLabel label="식당 주소">
          <input
            className={fieldClassName}
            onChange={(event) => updateValue('restaurantAddress', event.currentTarget.value)}
            value={values.restaurantAddress}
          />
        </FieldLabel>
        <div className="grid content-end gap-1.5">
          <label className={inlineButtonClassName}>
            사진에서 좌표 읽기
            <input
              accept="image/jpeg,image/tiff"
              className={hiddenFileInputClassName}
              onChange={handleGpsFileChange}
              type="file"
            />
          </label>
          <p className="m-0 text-xs leading-[1.35] text-[var(--subtext0)]">{gpsStatus}</p>
        </div>
      </div>
      {error ? <p className="m-0 text-sm text-[var(--red)]">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton onClick={onCancel}>취소</ActionButton>
        <ActionButton type="submit">저장</ActionButton>
      </div>
    </form>
  );
}

function ArticleForm({
  article,
  error,
  onCancel,
  onSubmit,
}: {
  article?: Article;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ArticleFormValues) => void;
}) {
  const [values, setValues] = useState<ArticleFormValues>(() => ({
    body: article?.body ?? '',
    photos:
      article?.photos.map((photo) => ({
        ...photo,
        fileName: photo.url.split('/').at(-1) ?? `photo-${photo.order}`,
      })) ?? [],
  }));

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    setValues((currentValues) => ({
      ...currentValues,
      photos: files.map((file, index) => ({
        fileName: file.name,
        order: index + 1,
        url: URL.createObjectURL(file),
      })),
    }));
    input.value = '';
  };

  const removePhoto = (order: number) => {
    setValues((currentValues) => ({
      ...currentValues,
      photos: currentValues.photos
        .filter((photo) => photo.order !== order)
        .map((photo, index) => ({
          ...photo,
          order: index + 1,
        })),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form
      className={`grid gap-4 bg-[var(--surface0)] !p-4 ${boxBorderClassName}`}
      box-="round"
      onSubmit={handleSubmit}
    >
      <Command>{article ? `article.edit ${article.id}` : 'article.new'}</Command>
      <FieldLabel label="사진">
        <label className={inlineButtonClassName}>
          사진 선택
          <input
            accept="image/*"
            className={hiddenFileInputClassName}
            multiple
            onChange={handlePhotoChange}
            type="file"
          />
        </label>
      </FieldLabel>
      {values.photos.length > 0 ? (
        <ol className="m-0 grid list-none gap-2 p-0">
          {values.photos.map((photo) => (
            <li
              className="flex min-w-0 flex-wrap items-center justify-between gap-2 border border-[var(--overlay0)] bg-[var(--background0)] px-3 py-2"
              key={`${photo.fileName}-${photo.order}`}
            >
              <span className="min-w-0 font-mono text-sm [overflow-wrap:anywhere] text-[var(--foreground1)]">
                order={photo.order} {photo.fileName}
              </span>
              <ActionButton onClick={() => removePhoto(photo.order)} tone="danger">
                제거
              </ActionButton>
            </li>
          ))}
        </ol>
      ) : (
        <p className="m-0 text-sm text-[var(--subtext0)]">사진을 1개 이상 선택해야 합니다.</p>
      )}
      <FieldLabel label="본문">
        <textarea
          className={`${fieldClassName} min-h-[8rem] resize-y`}
          onChange={(event) => {
            const body = event.currentTarget.value;

            setValues((currentValues) => ({
              ...currentValues,
              body,
            }));
          }}
          required
          value={values.body}
        />
      </FieldLabel>
      {error ? <p className="m-0 text-sm text-[var(--red)]">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton onClick={onCancel}>취소</ActionButton>
        <ActionButton type="submit">저장</ActionButton>
      </div>
    </form>
  );
}

function CommentForm({
  autoFocus,
  error,
  initialBody = '',
  onCancel,
  onSubmit,
  prompt,
}: {
  autoFocus?: boolean;
  error?: string;
  initialBody?: string;
  onCancel?: () => void;
  onSubmit: (body: string) => void;
  prompt: string;
}) {
  const [body, setBody] = useState(initialBody);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(body);
  };

  return (
    <form className="grid gap-2" onSubmit={handleSubmit}>
      <label className="grid gap-1.5">
        <span className="font-mono text-sm text-[var(--green)]">{prompt}</span>
        <textarea
          autoFocus={autoFocus}
          className={`${fieldClassName} min-h-[4.5rem] resize-y`}
          onChange={(event) => setBody(event.currentTarget.value)}
          required
          value={body}
        />
      </label>
      {error ? <p className="m-0 text-sm text-[var(--red)]">{error}</p> : null}
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? <ActionButton onClick={onCancel}>취소</ActionButton> : null}
        <ActionButton type="submit">저장</ActionButton>
      </div>
    </form>
  );
}

export function FeedCrudClient({
  articles: initialArticles,
  comments: initialComments,
  currentUser,
  hikings: initialHikings,
}: FeedCrudClientProps) {
  const currentAuthorName = useMemo(() => getAuthorName(currentUser), [currentUser]);
  const [articles, setArticles] = useState<Article[]>(() => [...initialArticles]);
  const [comments, setComments] = useState<Comment[]>(() => [...initialComments]);
  const [hikings, setHikings] = useState<Hiking[]>(() => [...initialHikings]);
  const [newHikingOpen, setNewHikingOpen] = useState(false);
  const [editingHikingId, setEditingHikingId] = useState<HikingId | null>(null);
  const [articleFormHikingId, setArticleFormHikingId] = useState<HikingId | null>(null);
  const [editingArticleId, setEditingArticleId] = useState<ArticleId | null>(null);
  const [replyingCommentId, setReplyingCommentId] = useState<CommentId | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<CommentId | null>(null);
  const [errorByKey, setErrorByKey] = useState<Record<string, string>>({});
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);

  const groups = useMemo(() => getFeedGroups(hikings, articles), [articles, hikings]);
  const commentsByArticleId = useMemo(() => getCommentsByArticleId(comments), [comments]);

  const setError = (key: string, value: string | null) => {
    setErrorByKey((currentErrors) => {
      const nextErrors = { ...currentErrors };

      if (value === null) {
        delete nextErrors[key];
      } else {
        nextErrors[key] = value;
      }

      return nextErrors;
    });
  };

  const createHiking = (values: HikingFormValues) => {
    const latitude = Number(values.latitude);
    const longitude = Number(values.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError('hiking-new', '위도와 경도는 숫자로 입력해야 합니다.');
      return;
    }

    const createdAt = nowIso();
    const hiking: Hiking = {
      authorName: currentAuthorName,
      completedAt: makeDateTime(values.hikingDate, values.completedTime, values.timezone),
      createdAt,
      hikingDate: values.hikingDate as IsoDateString,
      id: `hiking-local-${crypto.randomUUID()}` as HikingId,
      latitude: latitude as Latitude,
      longitude: longitude as Longitude,
      mountainName: values.mountainName,
      participantsCsv: values.participantsCsv,
      restaurantAddress: values.restaurantAddress.trim() || null,
      startedAt: makeDateTime(values.hikingDate, values.startedTime, values.timezone),
      timezone: values.timezone as Timezone,
      updatedAt: createdAt,
    };

    setHikings((currentHikings) => [hiking, ...currentHikings]);
    setNewHikingOpen(false);
    setError('hiking-new', null);
  };

  const updateHiking = (hikingId: HikingId, values: HikingFormValues) => {
    const latitude = Number(values.latitude);
    const longitude = Number(values.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError(`hiking-edit-${hikingId}`, '위도와 경도는 숫자로 입력해야 합니다.');
      return;
    }

    setHikings((currentHikings) =>
      currentHikings.map((hiking) =>
        hiking.id === hikingId
          ? {
              ...hiking,
              completedAt: makeDateTime(values.hikingDate, values.completedTime, values.timezone),
              hikingDate: values.hikingDate as IsoDateString,
              latitude: latitude as Latitude,
              longitude: longitude as Longitude,
              mountainName: values.mountainName,
              participantsCsv: values.participantsCsv,
              restaurantAddress: values.restaurantAddress.trim() || null,
              startedAt: makeDateTime(values.hikingDate, values.startedTime, values.timezone),
              timezone: values.timezone as Timezone,
              updatedAt: nowIso(),
            }
          : hiking,
      ),
    );
    setEditingHikingId(null);
    setError(`hiking-edit-${hikingId}`, null);
  };

  const requestDeleteHiking = (hiking: Hiking) => {
    const hasArticles = articles.some(
      (article) => article.hikingId === hiking.id && article.deletedAt === null,
    );

    if (hasArticles) {
      setError(`hiking-${hiking.id}`, '게시글이 있는 산행은 삭제할 수 없습니다.');
      return;
    }

    setConfirmState({
      body: `${hiking.mountainName} 산행 기록을 삭제합니다.`,
      confirmLabel: '삭제',
      onConfirm: () => {
        setHikings((currentHikings) => currentHikings.filter((item) => item.id !== hiking.id));
        setConfirmState(null);
      },
      title: '산행 삭제',
    });
  };

  const createArticle = (hikingId: HikingId, values: ArticleFormValues) => {
    if (values.photos.length === 0) {
      setError(`article-new-${hikingId}`, '게시글은 사진 없이 저장할 수 없습니다.');
      return;
    }

    const createdAt = nowIso();
    const article: Article = {
      authorName: currentAuthorName,
      body: values.body,
      createdAt,
      deletedAt: null,
      edited: false,
      hikingId,
      id: `article-local-${crypto.randomUUID()}` as ArticleId,
      photos:
        values.photos.length > 0
          ? [values.photos[0], ...values.photos.slice(1)]
          : [{ order: 1, url: thumbnailUrl }],
      updatedAt: createdAt,
    };

    setArticles((currentArticles) => [article, ...currentArticles]);
    setArticleFormHikingId(null);
    setError(`article-new-${hikingId}`, null);
  };

  const updateArticle = (articleId: ArticleId, values: ArticleFormValues) => {
    if (values.photos.length === 0) {
      setError(`article-edit-${articleId}`, '게시글은 사진 없이 저장할 수 없습니다.');
      return;
    }

    setArticles((currentArticles) =>
      currentArticles.map((article) =>
        article.id === articleId
          ? {
              ...article,
              body: values.body,
              edited: true,
              photos:
                values.photos.length > 0
                  ? [values.photos[0], ...values.photos.slice(1)]
                  : article.photos,
              updatedAt: nowIso(),
            }
          : article,
      ),
    );
    setEditingArticleId(null);
    setError(`article-edit-${articleId}`, null);
  };

  const requestDeleteArticle = (article: Article) => {
    setConfirmState({
      body: '게시글은 피드에서 숨겨지고 삭제 시각만 남습니다.',
      confirmLabel: '삭제',
      onConfirm: () => {
        setArticles((currentArticles) =>
          currentArticles.map((item) =>
            item.id === article.id ? { ...item, deletedAt: nowIso() } : item,
          ),
        );
        setConfirmState(null);
      },
      title: '게시글 삭제',
    });
  };

  const createComment = (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => {
    const createdAt = nowIso();
    const comment = {
      articleId,
      authorName: currentAuthorName,
      body,
      createdAt,
      deletedAt: null,
      id: `comment-local-${crypto.randomUUID()}` as CommentId,
      parentCommentId,
      updatedAt: createdAt,
    } as Comment;

    setComments((currentComments) => [...currentComments, comment]);
    setReplyingCommentId(null);
    setError(`comment-new-${articleId}`, null);
  };

  const updateComment = (commentId: CommentId, body: string) => {
    setComments((currentComments) =>
      currentComments.map((comment) =>
        comment.id === commentId ? { ...comment, body, updatedAt: nowIso() } : comment,
      ),
    );
    setEditingCommentId(null);
  };

  const requestDeleteComment = (comment: Comment) => {
    setConfirmState({
      body: '댓글은 대화 맥락이 필요하면 자리표시자로 남습니다.',
      confirmLabel: '삭제',
      onConfirm: () => {
        setComments((currentComments) =>
          currentComments.map((item) =>
            item.id === comment.id ? { ...item, deletedAt: nowIso(), body: '삭제된 댓글' } : item,
          ),
        );
        setConfirmState(null);
      },
      title: '댓글 삭제',
    });
  };

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <FeedTopbar currentAuthorName={currentAuthorName} user={currentUser} />

      <div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
        <section className={gridStackClassName} aria-label="산행 게시글 피드">
          <section
            className={`grid gap-4 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-4 ${boxBorderClassName}`}
            box-="round"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Command>feed.crud --mock</Command>
              <ActionButton onClick={() => setNewHikingOpen((open) => !open)}>
                산행 등록
              </ActionButton>
            </div>
            {newHikingOpen ? (
              <HikingForm
                error={errorByKey['hiking-new']}
                onCancel={() => {
                  setNewHikingOpen(false);
                  setError('hiking-new', null);
                }}
                onSubmit={createHiking}
              />
            ) : null}
          </section>

          {groups.map((group, groupIndex) => (
            <section
              className={gridStackClassName}
              key={`${group.hiking.id}-${groupIndex}`}
              aria-labelledby={`hiking-${group.hiking.id}`}
            >
              <HikingHeader
                canManageHiking={isOwn(group.hiking.authorName, currentAuthorName)}
                error={errorByKey[`hiking-${group.hiking.id}`]}
                hiking={group.hiking}
                onAddArticle={() => setArticleFormHikingId(group.hiking.id)}
                onDelete={() => requestDeleteHiking(group.hiking)}
                onEdit={() => setEditingHikingId(group.hiking.id)}
              />
              {editingHikingId === group.hiking.id ? (
                <HikingForm
                  error={errorByKey[`hiking-edit-${group.hiking.id}`]}
                  hiking={group.hiking}
                  onCancel={() => {
                    setEditingHikingId(null);
                    setError(`hiking-edit-${group.hiking.id}`, null);
                  }}
                  onSubmit={(values) => updateHiking(group.hiking.id, values)}
                />
              ) : null}
              {articleFormHikingId === group.hiking.id ? (
                <ArticleForm
                  error={errorByKey[`article-new-${group.hiking.id}`]}
                  onCancel={() => {
                    setArticleFormHikingId(null);
                    setError(`article-new-${group.hiking.id}`, null);
                  }}
                  onSubmit={(values) => createArticle(group.hiking.id, values)}
                />
              ) : null}
              <div className={gridStackClassName}>
                {group.articles.length > 0 ? (
                  group.articles.map((article) => (
                    <ArticlePanel
                      article={article}
                      canEdit={isOwn(article.authorName, currentAuthorName)}
                      comments={getArticleComments(commentsByArticleId, article.id)}
                      currentAuthorName={currentAuthorName}
                      editingArticleId={editingArticleId}
                      editingCommentId={editingCommentId}
                      errorByKey={errorByKey}
                      key={article.id}
                      onCancelArticleEdit={() => setEditingArticleId(null)}
                      onCreateComment={createComment}
                      onDeleteArticle={() => requestDeleteArticle(article)}
                      onDeleteComment={requestDeleteComment}
                      onEditArticle={() => setEditingArticleId(article.id)}
                      onEditComment={setEditingCommentId}
                      onReplyComment={setReplyingCommentId}
                      onSubmitArticleEdit={(values) => updateArticle(article.id, values)}
                      onSubmitCommentEdit={updateComment}
                      replyingCommentId={replyingCommentId}
                    />
                  ))
                ) : (
                  <div className={`bg-[var(--surface0)] !p-4 ${boxBorderClassName}`} box-="round">
                    <Command>articles.empty {group.hiking.id}</Command>
                    <p className="m-0 text-[var(--subtext0)]">아직 이 산행에 게시글이 없습니다.</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </section>

        <StatusPanel
          articleCount={articles.filter((article) => article.deletedAt === null).length}
          commentCount={getVisibleCommentCount(comments)}
          currentAuthorName={currentAuthorName}
          groupCount={groups.length}
          hikingCount={hikings.length}
        />
      </div>
      <FeedFooter
        articleCount={articles.filter((article) => article.deletedAt === null).length}
        commentCount={getVisibleCommentCount(comments)}
        hikingCount={hikings.length}
      />
      <ConfirmDialog
        confirmState={confirmState}
        onOpenChange={(open) => !open && setConfirmState(null)}
      />
    </main>
  );
}

function FeedTopbar({
  currentAuthorName,
  user,
}: {
  currentAuthorName: AuthorName;
  user: AuthenticatedUser;
}) {
  return (
    <header className="border-b border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--background0)_92%,transparent)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Command>
          <Link href="/">Hiking Society</Link> /feed
        </Command>
        <nav className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs leading-[1.4] text-[var(--subtext0)]">
            {String(currentAuthorName)} · {roleLabels[user.role]}
          </span>
          <Link is-="button" size-="small" variant-="foreground1" href="/me">
            마이페이지
          </Link>
        </nav>
      </div>
    </header>
  );
}

function HikingHeader({
  canManageHiking,
  error,
  hiking,
  onAddArticle,
  onDelete,
  onEdit,
}: {
  canManageHiking: boolean;
  error?: string;
  hiking: Hiking;
  onAddArticle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <>
      <header className="sticky top-2 z-20 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-4 py-3 shadow-[0_0.35rem_0_var(--background0)]">
        <h2
          className="m-0 text-[1.75rem] leading-[1.1] tracking-normal text-[var(--blue)]"
          id={`hiking-${hiking.id}`}
        >
          {hiking.mountainName}
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="text-[var(--yellow)]">{formatDateLabel(hiking.hikingDate)}</span>
          <ActionButton onClick={onAddArticle}>글 작성</ActionButton>
          {canManageHiking ? (
            <>
              <ActionButton onClick={onEdit}>수정</ActionButton>
              <ActionButton onClick={onDelete} tone="danger">
                삭제
              </ActionButton>
            </>
          ) : null}
        </div>
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
        {error ? <p className="mt-2 mb-0 text-sm text-[var(--red)]">{error}</p> : null}
      </div>
    </>
  );
}

function ArticlePanel({
  article,
  canEdit,
  comments,
  currentAuthorName,
  editingArticleId,
  editingCommentId,
  errorByKey,
  onCancelArticleEdit,
  onCreateComment,
  onDeleteArticle,
  onDeleteComment,
  onEditArticle,
  onEditComment,
  onReplyComment,
  onSubmitArticleEdit,
  onSubmitCommentEdit,
  replyingCommentId,
}: {
  article: Article;
  canEdit: boolean;
  comments: readonly Comment[];
  currentAuthorName: AuthorName;
  editingArticleId: ArticleId | null;
  editingCommentId: CommentId | null;
  errorByKey: Record<string, string>;
  onCancelArticleEdit: () => void;
  onCreateComment: (articleId: ArticleId, body: string, parentCommentId: CommentId | null) => void;
  onDeleteArticle: () => void;
  onDeleteComment: (comment: Comment) => void;
  onEditArticle: () => void;
  onEditComment: (commentId: CommentId | null) => void;
  onReplyComment: (commentId: CommentId | null) => void;
  onSubmitArticleEdit: (values: ArticleFormValues) => void;
  onSubmitCommentEdit: (commentId: CommentId, body: string) => void;
  replyingCommentId: CommentId | null;
}) {
  const { repliesByParentId, topLevelComments } = getThreadedComments(comments);

  return (
    <article
      className={`grid min-w-0 gap-5 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-5 [contain-intrinsic-size:auto_48rem] [content-visibility:auto] ${boxBorderClassName}`}
      box-="round"
    >
      <header className="grid gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <Command>article.open {article.id}</Command>
          {canEdit ? (
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={onEditArticle}>수정</ActionButton>
              <ActionButton onClick={onDeleteArticle} tone="danger">
                삭제
              </ActionButton>
            </div>
          ) : null}
        </div>
        <InlineMeta items={getArticleMeta(article, getVisibleCommentCount(comments))} />
      </header>

      {editingArticleId === article.id ? (
        <ArticleForm
          article={article}
          error={errorByKey[`article-edit-${article.id}`]}
          onCancel={onCancelArticleEdit}
          onSubmit={onSubmitArticleEdit}
        />
      ) : (
        <>
          <PhotoViewer
            articleId={article.id}
            authorName={article.authorName}
            photos={article.photos}
          />

          <p className="m-0 text-[1.05rem] leading-[1.6] break-keep text-[var(--foreground0)]">
            {article.body}
          </p>
        </>
      )}

      <section
        className="grid gap-3 border-t border-[var(--overlay0)] pt-3.5"
        aria-label={`${article.authorName} 게시글 댓글`}
      >
        <Command>comments.list --count={getVisibleCommentCount(comments)}</Command>
        <CommentForm
          error={errorByKey[`comment-new-${article.id}`]}
          onSubmit={(body) => onCreateComment(article.id, body, null)}
          prompt="comment.new>"
        />
        {topLevelComments.map((comment) => (
          <div className="grid min-w-0 gap-2" key={comment.id}>
            <CommentLine
              canEdit={isOwn(comment.authorName, currentAuthorName)}
              comment={comment}
              editingCommentId={editingCommentId}
              onDelete={onDeleteComment}
              onEdit={onEditComment}
              onReply={onReplyComment}
              onSubmitEdit={onSubmitCommentEdit}
              prompt="comment>"
              replies={(repliesByParentId.get(comment.id) ?? []).filter(
                (reply) => reply.deletedAt === null,
              )}
              replyingCommentId={replyingCommentId}
            />
            {replyingCommentId === comment.id ? (
              <div className="ml-4">
                <CommentForm
                  autoFocus
                  onCancel={() => onReplyComment(null)}
                  onSubmit={(body) => onCreateComment(article.id, body, comment.id)}
                  prompt="reply.new>"
                />
              </div>
            ) : null}
            {(repliesByParentId.get(comment.id) ?? [])
              .filter((reply) => reply.deletedAt === null)
              .map((reply) => (
                <CommentLine
                  canEdit={isOwn(reply.authorName, currentAuthorName)}
                  comment={reply}
                  editingCommentId={editingCommentId}
                  key={reply.id}
                  onDelete={onDeleteComment}
                  onEdit={onEditComment}
                  onReply={onReplyComment}
                  onSubmitEdit={onSubmitCommentEdit}
                  prompt="reply>"
                  reply
                  replies={[]}
                  replyingCommentId={replyingCommentId}
                />
              ))}
          </div>
        ))}
      </section>
    </article>
  );
}

function CommentLine({
  canEdit,
  comment,
  editingCommentId,
  onDelete,
  onEdit,
  onReply,
  onSubmitEdit,
  prompt,
  replies,
  reply,
}: {
  canEdit: boolean;
  comment: Comment;
  editingCommentId: CommentId | null;
  onDelete: (comment: Comment) => void;
  onEdit: (commentId: CommentId | null) => void;
  onReply: (commentId: CommentId | null) => void;
  onSubmitEdit: (commentId: CommentId, body: string) => void;
  prompt: string;
  replies: readonly Comment[];
  replyingCommentId: CommentId | null;
  reply?: boolean;
}) {
  const isDeleted = comment.deletedAt !== null;
  const shouldShowDeletedPlaceholder = isDeleted && replies.length > 0;

  if (isDeleted && !shouldShowDeletedPlaceholder) {
    return null;
  }

  return (
    <div
      className={`grid min-w-0 gap-1.5 text-[0.95rem] leading-[1.45] ${
        reply ? 'ml-4 text-[var(--subtext0)]' : 'text-[var(--foreground1)]'
      }`}
    >
      {editingCommentId === comment.id ? (
        <CommentForm
          autoFocus
          initialBody={comment.body}
          onCancel={() => onEdit(null)}
          onSubmit={(body) => onSubmitEdit(comment.id, body)}
          prompt={`${prompt}.edit`}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <span className="font-mono text-[var(--green)]">{prompt}</span>
              <span aria-hidden="true" className="mx-1 text-[var(--overlay1)]">
                ·
              </span>
              <DateTimeLabel
                className="font-mono text-[0.8125rem] whitespace-nowrap text-[var(--subtext0)]"
                value={comment.createdAt}
              />
            </div>
            {!isDeleted ? (
              <div className="flex flex-wrap gap-1.5">
                {!reply ? (
                  <ActionButton onClick={() => onReply(comment.id)}>답글</ActionButton>
                ) : null}
                {canEdit ? (
                  <>
                    <ActionButton onClick={() => onEdit(comment.id)}>수정</ActionButton>
                    <ActionButton onClick={() => onDelete(comment)} tone="danger">
                      삭제
                    </ActionButton>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          <p className="m-0 min-w-0 [overflow-wrap:anywhere]">
            {isDeleted ? (
              <span className="text-[var(--subtext0)]">삭제된 댓글</span>
            ) : (
              <>
                <span className="whitespace-nowrap text-[var(--pink)]">{comment.authorName}</span>
                <span aria-hidden="true" className="mx-1 text-[var(--overlay1)]">
                  :
                </span>
                <span>{comment.body}</span>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}

function StatusPanel({
  articleCount,
  commentCount,
  currentAuthorName,
  groupCount,
  hikingCount,
}: {
  articleCount: number;
  commentCount: number;
  currentAuthorName: AuthorName;
  groupCount: number;
  hikingCount: number;
}) {
  return (
    <aside
      className={`grid gap-3 self-start bg-[var(--surface0)] !p-4 lg:![position:sticky] lg:top-2 ${boxBorderClassName}`}
      box-="round"
      aria-label="피드 상태"
    >
      <Command>status --mock --ui-only</Command>
      <dl className="m-0 grid gap-2">
        <StatusRow label="access" value="invite" />
        <StatusRow label="mode" value="crud-photo-log" />
        <StatusRow label="actor" value={String(currentAuthorName)} />
        <StatusRow label="groups" value={groupCount} />
        <StatusRow label="hikings" value={hikingCount} />
        <StatusRow label="articles" value={articleCount} />
        <StatusRow label="comments" value={commentCount} />
      </dl>
    </aside>
  );
}

function FeedFooter({
  articleCount,
  commentCount,
  hikingCount,
}: {
  articleCount: number;
  commentCount: number;
  hikingCount: number;
}) {
  return (
    <footer className="mx-auto w-[min(100%,78rem)] px-4 pb-6 font-mono text-sm leading-[1.45] text-[var(--subtext0)] lg:px-5">
      <div className="border-t border-[var(--overlay0)] pt-3 text-center">
        <p className="m-0 text-[var(--mauve)]">~ EOF ~</p>
        <p className="m-0 mt-1 [overflow-wrap:anywhere]">
          hikings={hikingCount} articles={articleCount} comments={commentCount}
        </p>
      </div>
    </footer>
  );
}

function ConfirmDialog({
  confirmState,
  onOpenChange,
}: {
  confirmState: ConfirmState;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={confirmState !== null} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[color-mix(in_srgb,var(--background0)_78%,black)]" />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 z-50 grid w-[min(calc(100%-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 gap-4 bg-[var(--surface0)] !p-5 text-[var(--foreground0)] outline-none ${boxBorderClassName}`}
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
              className={`${inlineButtonClassName} text-[var(--red)]`}
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
