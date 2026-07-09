"use client";

import { $api } from "#/api/client/$api";
import { apiQueryKeys } from "#/api/client/queryKeys";
import { createCompressedWebpFile } from "#/features/media/imageCompression";
import {
	dialogOverlayClassName,
	inlineButtonClassName,
} from "#/features/shared/components/styles";
import { useRouter } from "#/features/shared/hooks/useRouter";
import * as Dialog from "@radix-ui/react-dialog";
import { useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

type ProfileActionState = {
	error?: string;
	ok: boolean;
};

type TextProfileEditDialogProps = {
	defaultValue: string;
	fieldLabel: string;
	fieldName: string;
	inputType: "email" | "text";
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
const profileSaveCooldownMs = 800;
const webpQuality = 85;
const profileInvalidateQueryKeys = [
	apiQueryKeys.feed(),
	apiQueryKeys.notifications(),
];

function getProfileInitial(value: string) {
	return value.trim().charAt(0).toUpperCase() || "?";
}

function invalidateProfileRelatedQueries(
	queryClient: ReturnType<typeof useQueryClient>,
) {
	void Promise.all(
		profileInvalidateQueryKeys.map((queryKey) =>
			queryClient.invalidateQueries({ queryKey }),
		),
	);
}

async function uploadDirectToS3(file: File, uploadUrl: string) {
	const response = await fetch(uploadUrl, {
		body: file,
		headers: {
			"Content-Type": file.type,
		},
		method: "PUT",
	});

	if (!response.ok) {
		throw new Error("S3 업로드에 실패했습니다.");
	}
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
						<div className="grid gap-2 border-[var(--overlay0)] border-b pb-3">
							<span className="font-mono text-[var(--mauve)] text-sm">
								profile.edit
							</span>
							<Dialog.Title className="m-0 text-[var(--foreground0)] text-xl leading-[1.2]">
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
	defaultValue,
	fieldLabel,
	fieldName,
	inputType,
	maxLength,
	title,
}: TextProfileEditDialogProps) {
	const queryClient = useQueryClient();
	const router = useRouter();
	const displayNameMutation = $api.useMutation(
		"patch",
		"/api/profile/display-name",
	);
	const emailMutation = $api.useMutation("patch", "/api/profile/email");
	const [open, setOpen] = useState(false);
	const submitLockedRef = useRef(false);
	const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [cooldownPending, setCooldownPending] = useState(false);
	const [state, setState] = useState<ProfileActionState>(initialState);

	const releaseAfterCooldown = useCallback(() => {
		if (cooldownTimerRef.current) {
			clearTimeout(cooldownTimerRef.current);
		}

		cooldownTimerRef.current = setTimeout(() => {
			cooldownTimerRef.current = null;
			submitLockedRef.current = false;
			setCooldownPending(false);
		}, profileSaveCooldownMs);
	}, []);

	const pending = displayNameMutation.isPending || emailMutation.isPending;
	const submitting = pending || cooldownPending;

	useEffect(() => {
		return () => {
			if (cooldownTimerRef.current) {
				clearTimeout(cooldownTimerRef.current);
			}
		};
	}, []);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		if (submitLockedRef.current) {
			event.preventDefault();
			return;
		}

		event.preventDefault();
		submitLockedRef.current = true;
		setCooldownPending(true);
		setState(initialState);

		const formData = new FormData(event.currentTarget);
		const value = String(formData.get(fieldName) ?? "");
		const mutation =
			fieldName === "displayName"
				? displayNameMutation.mutateAsync({ body: { displayName: value } })
				: emailMutation.mutateAsync({ body: { email: value } });

		mutation
			.then(() => {
				setOpen(false);
				invalidateProfileRelatedQueries(queryClient);
				router.refresh();
			})
			.catch((error: unknown) => {
				setState({
					error:
						error instanceof Error
							? error.message
							: "프로필을 저장하지 못했습니다.",
					ok: false,
				});
			})
			.finally(releaseAfterCooldown);
	};

	return (
		<ProfileDialogShell open={open} setOpen={setOpen} title={title}>
			<form className="grid gap-4" onSubmit={handleSubmit}>
				<label className="grid min-w-0 gap-1.5 text-[var(--subtext0)] text-sm">
					<span>{fieldLabel}</span>
					<input
						defaultValue={defaultValue}
						disabled={submitting}
						maxLength={maxLength}
						name={fieldName}
						required
						type={inputType}
					/>
				</label>
				{state.error ? (
					<p className="m-0 text-[var(--red)] text-sm">{state.error}</p>
				) : null}
				<div className="flex flex-wrap justify-end gap-2 border-[var(--overlay0)] border-t pt-3">
					<Dialog.Close asChild>
						<button
							className={inlineButtonClassName}
							disabled={submitting}
							type="button"
						>
							취소
						</button>
					</Dialog.Close>
					<button
						className={inlineButtonClassName}
						disabled={submitting}
						type="submit"
					>
						{submitting ? (
							<>
								<span is-="spinner" variant-="dots"></span>
								저장 중
							</>
						) : (
							"저장"
						)}
					</button>
				</div>
			</form>
		</ProfileDialogShell>
	);
}

export function DisplayNameEditDialog({
	displayName,
}: {
	displayName: string;
}) {
	return (
		<TextProfileEditDialog
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
	const queryClient = useQueryClient();
	const router = useRouter();
	const updateProfileImageMutation = $api.useMutation(
		"patch",
		"/api/profile/image",
	);
	const createProfileImageUploadTargetMutation = $api.useMutation(
		"post",
		"/api/profile-image/upload-target",
	);
	const deleteProfileImageUploadsMutation = $api.useMutation(
		"delete",
		"/api/profile-image/uploads",
	);
	const [open, setOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const submitLockedRef = useRef(false);
	const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [state, setState] = useState<ProfileActionState>(initialState);
	const [pending, setPending] = useState(false);
	const [previewUrl, setPreviewUrl] = useState<string | null>(profileImageUrl);
	const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
	const [removeProfileImage, setRemoveProfileImage] = useState(false);
	const [imageError, setImageError] = useState<string | null>(null);
	const initial = getProfileInitial(displayName);

	const releaseImageSubmitAfterCooldown = () => {
		if (cooldownTimerRef.current) {
			clearTimeout(cooldownTimerRef.current);
		}

		cooldownTimerRef.current = setTimeout(() => {
			cooldownTimerRef.current = null;
			submitLockedRef.current = false;
			setPending(false);
		}, profileSaveCooldownMs);
	};

	useEffect(() => {
		return () => {
			if (previewUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	useEffect(() => {
		return () => {
			if (cooldownTimerRef.current) {
				clearTimeout(cooldownTimerRef.current);
			}
		};
	}, []);

	const setPreview = (nextUrl: string | null) => {
		setPreviewUrl((currentUrl) => {
			if (currentUrl?.startsWith("blob:")) {
				URL.revokeObjectURL(currentUrl);
			}

			return nextUrl;
		});
	};

	const resetImageState = () => {
		setState(initialState);
		setProfileImageFile(null);
		setRemoveProfileImage(false);
		setImageError(null);
		setPreview(profileImageUrl);

		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleImageSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (submitLockedRef.current || pending || imageError) {
			return;
		}

		const uploadedObjectKeys: string[] = [];
		const formData = new FormData();

		if (removeProfileImage) {
			formData.set("removeProfileImage", "on");
		}

		submitLockedRef.current = true;
		setPending(true);
		setState(initialState);

		try {
			if (!removeProfileImage) {
				if (!profileImageFile) {
					throw new Error("새 프로필 이미지를 선택해주세요.");
				}

				const targetResult =
					await createProfileImageUploadTargetMutation.mutateAsync({
						body: {
							byteSize: profileImageFile.size,
							contentType: profileImageFile.type as "image/webp",
							fileName: profileImageFile.name,
						},
					});

				if (!targetResult) {
					throw new Error("업로드 URL을 만들지 못했습니다.");
				}

				await uploadDirectToS3(profileImageFile, targetResult.uploadUrl);
				uploadedObjectKeys.push(targetResult.objectKey);
				formData.set(
					"profileImage",
					JSON.stringify({
						byteSize: profileImageFile.size,
						contentType: profileImageFile.type,
						objectKey: targetResult.objectKey,
						url: targetResult.url,
					}),
				);
			}

			await updateProfileImageMutation.mutateAsync({
				body: {
					profileImage: formData.get("profileImage")
						? JSON.parse(String(formData.get("profileImage")))
						: undefined,
					removeProfileImage,
				},
			});
			setState({ ok: true });
			setOpen(false);
			invalidateProfileRelatedQueries(queryClient);
			router.refresh();
		} catch (error) {
			if (uploadedObjectKeys.length > 0) {
				await deleteProfileImageUploadsMutation.mutateAsync({
					body: { objectKeys: uploadedObjectKeys },
				});
			}

			setState({
				error:
					error instanceof Error
						? error.message
						: "프로필 이미지를 저장하지 못했습니다.",
				ok: false,
			});
		} finally {
			releaseImageSubmitAfterCooldown();
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

		if (!file.type.startsWith("image/")) {
			setImageError("이미지 파일만 선택해주세요.");
			input.value = "";
			return;
		}

		if (file.size > maxProfileImageSourceBytes) {
			setImageError("프로필 이미지는 12MB 이하만 선택해주세요.");
			input.value = "";
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
			setImageError("이미지를 변환하지 못했습니다.");
			setProfileImageFile(null);
			setPreview(profileImageUrl);
			input.value = "";
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
				fileInputRef.current.value = "";
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
			<form className="grid gap-4" onSubmit={handleImageSubmit}>
				<div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)]">
					{previewUrl ? (
						<img
							alt={`${displayName} 프로필 사진`}
							className="size-24 rounded-full border border-[var(--overlay0)] object-cover"
							src={previewUrl}
						/>
					) : (
						// biome-ignore lint/a11y/useAriaPropsSupportedByRole: TODO: fix
						<div
							aria-label={`${displayName} 프로필 사진 없음`}
							className="grid size-24 rounded-full border border-[var(--overlay0)] bg-[var(--background1)] text-4xl text-[var(--blue)]"
						>
							<span className="place-self-center">{initial}</span>
						</div>
					)}
					<div className="grid min-w-0 gap-3">
						<div className="grid min-w-0 gap-1.5 text-[var(--subtext0)] text-sm">
							<span>이미지 파일</span>
							<div className="flex min-w-0 flex-wrap items-center gap-2">
								<label
									className={`${inlineButtonClassName} ${
										removeProfileImage || pending
											? "cursor-not-allowed opacity-45"
											: ""
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
								<span className="min-w-0 font-mono text-[var(--subtext1)] text-xs [overflow-wrap:anywhere]">
									{profileImageFile
										? profileImageFile.name
										: "선택된 파일 없음"}
								</span>
							</div>
						</div>
						<label className="inline-flex min-w-0 items-center gap-2 text-[var(--subtext0)] text-sm">
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
					<p className="m-0 min-w-0 font-mono text-[var(--green)] text-xs [overflow-wrap:anywhere]">
						{profileImageFile.name} / {Math.ceil(profileImageFile.size / 1024)}
						KB / WEBP 640px
					</p>
				) : null}
				{imageError ? (
					<p className="m-0 text-[var(--red)] text-sm">{imageError}</p>
				) : null}
				{state.error ? (
					<p className="m-0 text-[var(--red)] text-sm">{state.error}</p>
				) : null}
				<div className="flex flex-wrap justify-end gap-2 border-[var(--overlay0)] border-t pt-3">
					<Dialog.Close asChild>
						<button
							className={inlineButtonClassName}
							disabled={pending}
							type="button"
						>
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
							"저장"
						)}
					</button>
				</div>
			</form>
		</ProfileDialogShell>
	);
}
