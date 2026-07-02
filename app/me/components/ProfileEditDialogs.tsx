'use client';

import * as Dialog from '@radix-ui/react-dialog';
import type { ChangeEvent, ReactNode } from 'react';
import { useActionState, useCallback, useEffect, useRef, useState } from 'react';

import { dialogOverlayClassName, inlineButtonClassName } from '@/app/common/components/styles';
import { createCompressedWebpFile } from '@/app/common/utils/imageCompression';
import {
  updateDisplayName,
  updateEmail,
  updateProfileImage,
  type ProfileActionState,
} from '../actions';

type TextProfileEditDialogProps = {
  action: (prevState: ProfileActionState, formData: FormData) => Promise<ProfileActionState>;
  defaultValue: string;
  fieldLabel: string;
  fieldName: string;
  inputType: 'email' | 'text';
  maxLength: number;
  title: string;
};

type ProfileImageEditDialogProps = {
  displayName: string;
  profileImageUrl: string | null;
  trigger?: ReactNode;
};

const initialState: ProfileActionState = { ok: false };
const maxProfileImageSourceBytes = 12 * 1024 * 1024;
const profileImageMaxWidth = 640;
const webpQuality = 85;

function getProfileInitial(value: string) {
  return value.trim().charAt(0).toUpperCase() || '?';
}

function ProfileDialogShell({
  children,
  open,
  setOpen,
  title,
  trigger,
}: {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  trigger?: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <button className={inlineButtonClassName} type="button">
            수정
          </button>
        )}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className={dialogOverlayClassName} />
        <Dialog.Content className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4 text-[var(--foreground0)] outline-none">
          <div className="grid max-h-[calc(100svh-2rem)] w-full max-w-[28rem] gap-4 overflow-y-auto border border-[var(--overlay0)] bg-[var(--surface0)] p-5 shadow-[0.35rem_0.35rem_0_var(--background0)]">
            <div className="grid gap-2 border-b border-[var(--overlay0)] pb-3">
              <span className="font-mono text-sm text-[var(--mauve)]">profile.edit</span>
              <Dialog.Title className="m-0 text-xl leading-[1.2] text-[var(--foreground0)]">
                {title}
              </Dialog.Title>
            </div>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function TextProfileEditDialog({
  action,
  defaultValue,
  fieldLabel,
  fieldName,
  inputType,
  maxLength,
  title,
}: TextProfileEditDialogProps) {
  const [open, setOpen] = useState(false);
  const actionWithClose = useCallback(
    async (prevState: ProfileActionState, formData: FormData) => {
      const result = await action(prevState, formData);

      if (result.ok) {
        setOpen(false);
      }

      return result;
    },
    [action],
  );
  const [state, formAction, pending] = useActionState(actionWithClose, initialState);

  return (
    <ProfileDialogShell open={open} setOpen={setOpen} title={title}>
      <form action={formAction} className="grid gap-4">
        <label className="grid min-w-0 gap-1.5 text-sm text-[var(--subtext0)]">
          <span>{fieldLabel}</span>
          <input
            defaultValue={defaultValue}
            disabled={pending}
            maxLength={maxLength}
            name={fieldName}
            required
            type={inputType}
          />
        </label>
        {state.error ? <p className="m-0 text-sm text-[var(--red)]">{state.error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--overlay0)] pt-3">
          <Dialog.Close asChild>
            <button className={inlineButtonClassName} disabled={pending} type="button">
              취소
            </button>
          </Dialog.Close>
          <button className={inlineButtonClassName} disabled={pending} type="submit">
            {pending ? (
              <>
                <span is-="spinner" variant-="dots"></span>
                저장 중
              </>
            ) : (
              '저장'
            )}
          </button>
        </div>
      </form>
    </ProfileDialogShell>
  );
}

export function DisplayNameEditDialog({ displayName }: { displayName: string }) {
  return (
    <TextProfileEditDialog
      action={updateDisplayName}
      defaultValue={displayName}
      fieldLabel="이름"
      fieldName="displayName"
      inputType="text"
      maxLength={100}
      title="이름 수정"
    />
  );
}

export function EmailEditDialog({ email }: { email: string }) {
  return (
    <TextProfileEditDialog
      action={updateEmail}
      defaultValue={email}
      fieldLabel="이메일"
      fieldName="email"
      inputType="email"
      maxLength={320}
      title="이메일 수정"
    />
  );
}

export function ProfileImageEditDialog({
  displayName,
  profileImageUrl,
  trigger,
}: ProfileImageEditDialogProps) {
  const [open, setOpen] = useState(false);
  const actionWithClose = useCallback(async (prevState: ProfileActionState, formData: FormData) => {
    const result = await updateProfileImage(prevState, formData);

    if (result.ok) {
      setOpen(false);
    }

    return result;
  }, []);
  const [state, formAction, pending] = useActionState(actionWithClose, initialState);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profileImageUrl);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const initial = getProfileInitial(displayName);

  useEffect(() => {
    const input = profileImageInputRef.current;

    if (!input) {
      return;
    }

    const dataTransfer = new DataTransfer();

    if (profileImageFile) {
      dataTransfer.items.add(profileImageFile);
    }

    input.files = dataTransfer.files;
  }, [profileImageFile]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const setPreview = (nextUrl: string | null) => {
    setPreviewUrl((currentUrl) => {
      if (currentUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }

      return nextUrl;
    });
  };

  const resetImageState = () => {
    setProfileImageFile(null);
    setRemoveProfileImage(false);
    setImageError(null);
    setPreview(profileImageUrl);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetImageState();
    }
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    setImageError(null);

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 선택해주세요.');
      input.value = '';
      return;
    }

    if (file.size > maxProfileImageSourceBytes) {
      setImageError('프로필 이미지는 12MB 이하만 선택해주세요.');
      input.value = '';
      return;
    }

    try {
      const compressedFile = await createCompressedWebpFile(file, {
        maxWidth: profileImageMaxWidth,
        quality: webpQuality,
      });

      setProfileImageFile(compressedFile);
      setRemoveProfileImage(false);
      setPreview(URL.createObjectURL(compressedFile));
    } catch {
      setImageError('이미지를 변환하지 못했습니다.');
      setProfileImageFile(null);
      setPreview(profileImageUrl);
      input.value = '';
    }
  };

  const handleRemoveImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.currentTarget.checked;

    setRemoveProfileImage(checked);
    setImageError(null);

    if (checked) {
      setProfileImageFile(null);
      setPreview(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setPreview(profileImageUrl);
    }
  };

  return (
    <ProfileDialogShell
      open={open}
      setOpen={handleOpenChange}
      title="프로필 이미지 수정"
      trigger={trigger}
    >
      <form action={formAction} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
          {previewUrl ? (
            <img
              alt={`${displayName} 프로필 사진`}
              className="size-24 rounded-full border border-[var(--overlay0)] object-cover"
              src={previewUrl}
            />
          ) : (
            <div
              aria-label={`${displayName} 프로필 사진 없음`}
              className="grid size-24 rounded-full border border-[var(--overlay0)] bg-[var(--background1)] text-4xl text-[var(--blue)]"
            >
              <span className="place-self-center">{initial}</span>
            </div>
          )}
          <div className="grid min-w-0 gap-3">
            <div className="grid min-w-0 gap-1.5 text-sm text-[var(--subtext0)]">
              <span>이미지 파일</span>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <label
                  className={`${inlineButtonClassName} ${
                    removeProfileImage || pending ? 'cursor-not-allowed opacity-45' : ''
                  }`}
                >
                  파일 선택
                  <input
                    accept="image/*"
                    className="sr-only"
                    disabled={removeProfileImage || pending}
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    type="file"
                  />
                </label>
                <span className="min-w-0 font-mono text-xs [overflow-wrap:anywhere] text-[var(--subtext1)]">
                  {profileImageFile ? profileImageFile.name : '선택된 파일 없음'}
                </span>
              </div>
            </div>
            <label className="inline-flex min-w-0 items-center gap-2 text-sm text-[var(--subtext0)]">
              <input
                checked={removeProfileImage}
                name="removeProfileImage"
                onChange={handleRemoveImageChange}
                type="checkbox"
              />
              이미지 제거
            </label>
          </div>
        </div>
        {profileImageFile ? (
          <p className="m-0 min-w-0 font-mono text-xs [overflow-wrap:anywhere] text-[var(--green)]">
            {profileImageFile.name} / {Math.ceil(profileImageFile.size / 1024)}KB / WEBP 640px
          </p>
        ) : null}
        <input className="sr-only" name="profileImage" ref={profileImageInputRef} type="file" />
        {imageError ? <p className="m-0 text-sm text-[var(--red)]">{imageError}</p> : null}
        {state.error ? <p className="m-0 text-sm text-[var(--red)]">{state.error}</p> : null}
        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--overlay0)] pt-3">
          <Dialog.Close asChild>
            <button className={inlineButtonClassName} disabled={pending} type="button">
              취소
            </button>
          </Dialog.Close>
          <button
            className={inlineButtonClassName}
            disabled={pending || Boolean(imageError)}
            type="submit"
          >
            {pending ? (
              <>
                <span is-="spinner" variant-="dots"></span>
                저장 중
              </>
            ) : (
              '저장'
            )}
          </button>
        </div>
      </form>
    </ProfileDialogShell>
  );
}
