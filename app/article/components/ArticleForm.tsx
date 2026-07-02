'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState } from 'react';

import { ActionButton } from '@/app/common/components/ActionButton';
import { Command } from '@/app/common/components/Command';
import { FieldLabel } from '@/app/common/components/FieldLabel';
import {
  boxBorderClassName,
  fieldClassName,
  hiddenFileInputClassName,
  inlineButtonClassName,
} from '@/app/common/components/styles';
import type { Article } from '@/core/article/domain';

import type { ArticleFormValues, DraftPhoto } from './articleFormTypes';
import { getArticleFormDefaults, revokeDraftPhotoUrl } from './articleFormUtils';

type ArticleFormProps = {
  article?: Article;
  error?: string;
  onCancel: () => void;
  onSubmit: (values: ArticleFormValues) => void;
};

export function ArticleForm({ article, error, onCancel, onSubmit }: ArticleFormProps) {
  const [values, setValues] = useState<ArticleFormValues>(() => getArticleFormDefaults(article));

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      return;
    }

    setValues((currentValues) => {
      currentValues.photos.forEach(revokeDraftPhotoUrl);

      return {
        ...currentValues,
        photos: files.map((file, index) => ({
          fileName: file.name,
          order: index + 1,
          url: URL.createObjectURL(file),
        })),
      };
    });
    input.value = '';
  };

  const removePhoto = (order: number) => {
    setValues((currentValues) => ({
      ...currentValues,
      photos: currentValues.photos
        .filter((photo) => {
          const keepPhoto = photo.order !== order;

          if (!keepPhoto) {
            revokeDraftPhotoUrl(photo);
          }

          return keepPhoto;
        })
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

  const handleCancel = () => {
    values.photos.forEach(revokeDraftPhotoUrl);
    onCancel();
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
        <ol className="m-0 flex list-none flex-wrap gap-3 p-0">
          {values.photos.map((photo: DraftPhoto) => (
            <li
              className="grid w-full min-w-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--background0)] sm:w-[16rem]"
              key={`${photo.fileName}-${photo.order}`}
            >
              <img
                alt={`선택한 게시글 사진 ${photo.order}`}
                className="aspect-4/3 w-full border-b border-[var(--overlay0)] object-cover"
                src={photo.url}
              />
              <div className="grid gap-2 px-3 py-2">
                <span className="min-w-0 font-mono text-sm [overflow-wrap:anywhere] text-[var(--foreground1)]">
                  order={photo.order} {photo.fileName}
                </span>
                <ActionButton onClick={() => removePhoto(photo.order)} tone="danger">
                  제거
                </ActionButton>
              </div>
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
        <ActionButton onClick={handleCancel}>취소</ActionButton>
        <ActionButton type="submit">저장</ActionButton>
      </div>
    </form>
  );
}
