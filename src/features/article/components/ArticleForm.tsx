"use client";

import type { PreparedImageSource } from "#/features/media/imageCompression";
import { ActionButton } from "#/features/shared/components/ActionButton";
import { Command } from "#/features/shared/components/Command";
import { FieldLabel } from "#/features/shared/components/FieldLabel";
import { LoadingOverlay } from "#/features/shared/components/LoadingOverlay";
import {
	boxBorderClassName,
	fieldClassName,
	hiddenFileInputClassName,
	inlineButtonClassName,
} from "#/features/shared/components/styles";
import type { Article } from "@/core/article/domain";
import type { Hiking } from "@/core/hiking/domain";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { ArticleFormValues, DraftMedia } from "./articleFormTypes";
import {
	createCompressedDraftMedia,
	getArticleFormDefaults,
	getDuplicateMediaKeys,
	getMediaDuplicateKey,
	revokeDraftMediaUrl,
	rotateDraftMediaFile,
	sortNewDraftMedias,
} from "./articleFormUtils";
import { getMediaTakenTimeLabel, MediaViewer } from "./MediaViewer";

type ArticleFormProps = {
	article?: Article;
	error?: string;
	hiking?: Hiking;
	onCancel: () => void;
	onDirtyChange?: (dirty: boolean) => void;
	onSubmit: (values: ArticleFormValues) => void;
	submitting?: boolean;
};

function reorderDraftMedias(media: readonly DraftMedia[]) {
	return media.map((media, index) => ({
		...media,
		order: index + 1,
	}));
}

function getMediaDirtyKey(media: DraftMedia) {
	return [
		media.order,
		media.objectKey ?? "",
		media.url,
		media.fileName,
		media.fileSize ?? "",
		media.lastModified ?? "",
		media.mediaType,
	].join(":");
}

function isArticleFormDirty(
	values: ArticleFormValues,
	initialValues: ArticleFormValues,
) {
	if (values.body !== initialValues.body) {
		return true;
	}

	if (values.media.length !== initialValues.media.length) {
		return true;
	}

	return values.media.some((media, index) => {
		const initialMedia = initialValues.media[index];

		return (
			initialMedia === undefined ||
			getMediaDirtyKey(media) !== getMediaDirtyKey(initialMedia)
		);
	});
}

export function ArticleForm({
	article,
	error,
	hiking,
	onCancel,
	onDirtyChange,
	onSubmit,
	submitting = false,
}: ArticleFormProps) {
	const [initialValues] = useState<ArticleFormValues>(() =>
		getArticleFormDefaults(article),
	);
	const [values, setValues] = useState<ArticleFormValues>(initialValues);
	const [mediaError, setMediaError] = useState<string | null>(null);
	const [isProcessingMedia, setIsProcessingMedia] = useState(false);
	const [isProcessingOverlayOpen, setIsProcessingOverlayOpen] = useState(false);
	const [rotatingSource, setRotatingSource] =
		useState<PreparedImageSource | null>(null);
	const [processingLabel, setProcessingLabel] = useState("처리 중");
	const [draggedMediaOrder, setDraggedMediaOrder] = useState<number | null>(
		null,
	);
	const [isMediaDropActive, setIsMediaDropActive] = useState(false);
	const dragPreviewRef = useRef<HTMLElement | null>(null);
	const valuesRef = useRef(values);
	const disabled = isProcessingMedia || submitting;
	const isDirty = useMemo(
		() => isArticleFormDirty(values, initialValues),
		[initialValues, values],
	);

	useEffect(() => {
		valuesRef.current = values;
	}, [values]);

	useEffect(() => {
		onDirtyChange?.(isDirty);
	}, [isDirty, onDirtyChange]);

	useEffect(() => {
		return () => {
			dragPreviewRef.current?.remove();
			dragPreviewRef.current = null;
			valuesRef.current.media.forEach(revokeDraftMediaUrl);
		};
	}, []);

	const removeMediaDragPreview = () => {
		dragPreviewRef.current?.remove();
		dragPreviewRef.current = null;
	};

	const setMediaDragPreview = (event: DragEvent<HTMLLIElement>) => {
		removeMediaDragPreview();

		const sourceCard = event.currentTarget;
		const sourceRect = sourceCard.getBoundingClientRect();
		const previewCard = sourceCard.cloneNode(true) as HTMLElement;
		const offsetX = event.clientX - sourceRect.left;
		const offsetY = event.clientY - sourceRect.top;

		previewCard.setAttribute("aria-hidden", "true");
		previewCard.style.width = `${sourceRect.width}px`;
		previewCard.style.position = "fixed";
		previewCard.style.top = "-10000px";
		previewCard.style.left = "-10000px";
		previewCard.style.pointerEvents = "none";
		previewCard.style.opacity = "0.94";
		previewCard.style.boxShadow =
			"0 18px 48px color-mix(in_srgb, var(--background0) 72%, black)";
		previewCard.style.zIndex = "9999";

		document.body.append(previewCard);
		dragPreviewRef.current = previewCard;
		event.dataTransfer.setDragImage(previewCard, offsetX, offsetY);
	};

	const handleMediaFiles = async (files: File[]) => {
		if (disabled || rotatingSource !== null || files.length === 0) {
			return;
		}

		setMediaError(null);
		setIsProcessingMedia(true);
		setIsProcessingOverlayOpen(true);

		try {
			const settledMedias = await Promise.allSettled(
				files.map(async (file, index) => {
					try {
						return await createCompressedDraftMedia(
							file,
							index + 1,
							(progress) => {
								setProcessingLabel(
									`${file.name} 변환 중 ${Math.round(Math.max(0, Math.min(progress, 1)) * 100)}%`,
								);
							},
						);
					} catch (error) {
						throw new Error(
							error instanceof Error
								? `${file.name}: ${error.message}`
								: `${file.name}: 사진이나 동영상을 변환하지 못했습니다.`,
						);
					}
				}),
			);
			const compressedMedias = settledMedias.flatMap((result) =>
				result.status === "fulfilled" ? [result.value] : [],
			);
			const failedFileNames = settledMedias.flatMap((result) =>
				result.status === "rejected" && result.reason instanceof Error
					? [result.reason.message]
					: [],
			);

			if (failedFileNames.length > 0) {
				setMediaError(failedFileNames.join(" "));
			}

			if (compressedMedias.length === 0) {
				return;
			}

			const sortedNewMedias = sortNewDraftMedias(compressedMedias);

			setValues((currentValues) => {
				const appendedMedias = [
					...currentValues.media,
					...sortedNewMedias.map((media, index) => ({
						...media,
						order: currentValues.media.length + index + 1,
					})),
				];

				return {
					...currentValues,
					media: reorderDraftMedias(appendedMedias),
				};
			});
		} finally {
			setProcessingLabel("사진이나 동영상 처리 중");
			setIsProcessingMedia(false);
			setIsProcessingOverlayOpen(false);
		}
	};

	const handleMediaChange = async (event: ChangeEvent<HTMLInputElement>) => {
		const input = event.currentTarget;
		const files = Array.from(input.files ?? []);

		input.value = "";
		await handleMediaFiles(files);
	};

	const hasFileTransfer = (event: DragEvent<HTMLElement>) =>
		Array.from(event.dataTransfer.types).includes("Files");

	const handleMediaDropAreaDragOver = (event: DragEvent<HTMLDivElement>) => {
		if (disabled || !hasFileTransfer(event)) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = "copy";
		setIsMediaDropActive(true);
	};

	const handleMediaDropAreaDrop = async (event: DragEvent<HTMLDivElement>) => {
		if (!hasFileTransfer(event)) {
			return;
		}

		event.preventDefault();
		setIsMediaDropActive(false);
		await handleMediaFiles(Array.from(event.dataTransfer.files));
	};

	const moveMedia = (fromOrder: number, toOrder: number) => {
		if (fromOrder === toOrder) {
			return;
		}

		setValues((currentValues) => {
			const fromIndex = currentValues.media.findIndex(
				(media) => media.order === fromOrder,
			);
			const toIndex = currentValues.media.findIndex(
				(media) => media.order === toOrder,
			);

			if (fromIndex === -1 || toIndex === -1) {
				return currentValues;
			}

			const reorderedMedias = [...currentValues.media];
			const [movedMedia] = reorderedMedias.splice(fromIndex, 1);

			if (!movedMedia) {
				return currentValues;
			}

			reorderedMedias.splice(toIndex, 0, movedMedia);

			return {
				...currentValues,
				media: reorderDraftMedias(reorderedMedias),
			};
		});
	};

	const handleMediaDragStart = (
		event: DragEvent<HTMLLIElement>,
		order: number,
	) => {
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", String(order));
		setMediaDragPreview(event);
		setDraggedMediaOrder(order);
	};

	const handleMediaDragOver = (
		event: DragEvent<HTMLLIElement>,
		order: number,
	) => {
		if (hasFileTransfer(event)) {
			return;
		}

		if (draggedMediaOrder === null || draggedMediaOrder === order) {
			return;
		}

		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	};

	const handleMediaDrop = (event: DragEvent<HTMLLIElement>, order: number) => {
		if (hasFileTransfer(event)) {
			return;
		}

		event.preventDefault();

		const transferOrder = Number(event.dataTransfer.getData("text/plain"));
		const fromOrder = draggedMediaOrder ?? transferOrder;

		if (Number.isFinite(fromOrder)) {
			moveMedia(fromOrder, order);
		}

		setDraggedMediaOrder(null);
		removeMediaDragPreview();
	};

	const rotateMedia = async (order: number) => {
		if (disabled || rotatingSource !== null) {
			return;
		}

		const target = valuesRef.current.media.find(
			(media) => media.order === order,
		);

		if (target?.mediaType !== "image" || !target.preparedSource) {
			return;
		}

		// Rotation runs per photo without flipping the shared `disabled` state, so only
		// this card's own button is blocked while the other controls stay untouched.
		const { preparedSource } = target;

		setMediaError(null);
		setProcessingLabel("사진 회전 중");
		setRotatingSource(preparedSource);

		// Only surface the loader when the rotation is slow enough to notice, so quick
		// rotations don't flash the overlay.
		const overlayTimer = window.setTimeout(
			() => setIsProcessingOverlayOpen(true),
			300,
		);

		try {
			const rotation = ((target.rotation ?? 0) + 1) % 4;
			const rotatedFile = await rotateDraftMediaFile(preparedSource, rotation);

			// The photo may have been removed while rotating; drop the result instead of
			// leaking its object URL. Matching by prepared source keeps reorders safe too.
			if (
				!valuesRef.current.media.some(
					(media) => media.preparedSource === preparedSource,
				)
			) {
				return;
			}

			const rotatedUrl = URL.createObjectURL(rotatedFile);

			setValues((currentValues) => ({
				...currentValues,
				media: currentValues.media.map((media) => {
					if (media.preparedSource !== preparedSource) {
						return media;
					}

					if (media.url.startsWith("blob:")) {
						URL.revokeObjectURL(media.url);
					}

					return {
						...media,
						file: rotatedFile,
						fileName: rotatedFile.name,
						fileSize: rotatedFile.size,
						lastModified: rotatedFile.lastModified,
						rotation,
						url: rotatedUrl,
					};
				}),
			}));
		} catch (error) {
			setMediaError(
				error instanceof Error
					? `${target.fileName}: ${error.message}`
					: `${target.fileName}: 사진을 회전하지 못했습니다.`,
			);
		} finally {
			window.clearTimeout(overlayTimer);
			setProcessingLabel("사진이나 동영상 처리 중");
			setRotatingSource(null);
			setIsProcessingOverlayOpen(false);
		}
	};

	const removeMedia = (order: number) => {
		setValues((currentValues) => ({
			...currentValues,
			media: currentValues.media
				.filter((media) => {
					const keepMedia = media.order !== order;

					if (!keepMedia) {
						revokeDraftMediaUrl(media);
					}

					return keepMedia;
				})
				.map((media, index) => ({
					...media,
					order: index + 1,
				})),
		}));
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (disabled || rotatingSource !== null) {
			return;
		}

		onSubmit(values);
	};

	const handleCancel = () => {
		onCancel();
	};

	const duplicateMediaKeys = getDuplicateMediaKeys(values.media);

	return (
		<>
			<form
				className={`!p-4 grid gap-4 bg-[var(--surface0)] ${boxBorderClassName}`}
				box-="round"
				onSubmit={handleSubmit}
			>
				<Command>
					{article ? `article.edit ${article.id}` : "article.new"}{" "}
					{hiking ? `(hiking #${hiking.order} ${hiking.mountainName})` : ""}
				</Command>
				{/** biome-ignore lint/a11y/noStaticElementInteractions: TODO: fix */}
				<div
					className={`grid gap-3 border border-dashed p-3 transition-[background-color,border-color,opacity] ${
						disabled ? "opacity-70" : ""
					} ${
						isMediaDropActive
							? "border-[var(--blue)] bg-[var(--surface1)]"
							: "border-[var(--overlay0)] bg-[var(--background0)]"
					}`}
					onDragLeave={(event) => {
						if (
							!event.currentTarget.contains(event.relatedTarget as Node | null)
						) {
							setIsMediaDropActive(false);
						}
					}}
					onDragOver={handleMediaDropAreaDragOver}
					onDrop={handleMediaDropAreaDrop}
				>
					<FieldLabel label="사진이나 동영상">
						<label
							className={`${inlineButtonClassName} ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
						>
							사진이나 동영상 선택
							<input
								accept="image/*,.heic,.heif,image/heic,image/heif,video/*"
								className={hiddenFileInputClassName}
								disabled={disabled}
								multiple
								onChange={handleMediaChange}
								type="file"
							/>
						</label>
					</FieldLabel>
					<p className="m-0 hidden text-[var(--subtext0)] text-xs leading-[1.35] sm:block">
						파일을 이 영역에 드롭해도 추가됩니다.
					</p>
					{mediaError ? (
						<p className="m-0 text-[var(--red)] text-sm">{mediaError}</p>
					) : null}
					{values.media.length > 0 ? (
						<ol className="m-0 flex list-none flex-wrap gap-3 p-0">
							{values.media.map((media: DraftMedia) => {
								const duplicateKey = getMediaDuplicateKey(media);
								const isDuplicate =
									duplicateKey !== null && duplicateMediaKeys.has(duplicateKey);
								const isDragged = draggedMediaOrder === media.order;
								const canMoveUp = media.order > 1;
								const canMoveDown = media.order < values.media.length;
								const canRotate =
									media.mediaType === "image" && Boolean(media.preparedSource);
								const takenTime = getMediaTakenTimeLabel(media);

								return (
									<li
										aria-label={`선택한 글 사진이나 동영상 ${media.order}번째`}
										className={`grid w-full min-w-0 cursor-grab overflow-hidden bg-[var(--background0)] transition-[background-color,border-color,opacity] active:cursor-grabbing sm:w-[16rem] ${
											isDuplicate
												? "border-2 border-[var(--peach)]"
												: "border border-[var(--overlay0)]"
										} ${
											isDragged
												? "!border-[var(--blue)] !bg-[var(--surface1)] opacity-70"
												: "hover:border-[var(--blue)]"
										}`}
										draggable
										key={`${media.fileName}-${media.order}`}
										onDragEnd={() => {
											setDraggedMediaOrder(null);
											removeMediaDragPreview();
										}}
										onDragOver={(event) =>
											handleMediaDragOver(event, media.order)
										}
										onDragStart={(event) =>
											handleMediaDragStart(event, media.order)
										}
										onDrop={(event) => handleMediaDrop(event, media.order)}
									>
										<MediaViewer
											articleId={article?.id ?? "draft"}
											authorName="선택한 글"
											initialIndex={media.order - 1}
											media={values.media}
											trigger={
												<span className="relative block">
													<img
														alt={`선택한 글 사진이나 동영상 ${media.order}`}
														className="aspect-4/3 w-full border-[var(--overlay0)] border-b bg-[var(--background0)] object-contain transition-[filter] group-hover:brightness-110"
														draggable={false}
														src={media.thumbnailUrl ?? media.url}
													/>
													{media.mediaType === "video" ? (
														<span className="absolute right-2 bottom-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-1.5 py-0.5 font-mono text-[var(--foreground0)] text-xs">
															video
														</span>
													) : null}
												</span>
											}
											triggerClassName="group block h-auto w-full appearance-none !border-0 !bg-transparent !bg-none p-0 text-left leading-none !shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
											viewerCommand="article.media.preview"
											viewerLabel="선택한 글 사진이나 동영상"
										/>
										<div className="grid gap-2 px-3 py-2">
											<span className="min-w-0 font-mono text-[var(--foreground1)] text-sm [overflow-wrap:anywhere]">
												order={media.order} {media.fileName}
											</span>
											<span className="flex min-w-0 items-center justify-between gap-2 font-mono text-[var(--subtext0)] text-sm leading-none">
												<span>
													{media.mediaType} {media.order}/{values.media.length}
												</span>
												{takenTime ? <span>{takenTime}</span> : null}
											</span>
											{isDuplicate ? (
												<span className="text-[var(--peach)] text-sm leading-[1.35]">
													동일한 사진이나 동영상이 선택되었습니다.
												</span>
											) : null}
											<div
												className={`grid gap-2 ${canRotate ? "grid-cols-4" : "grid-cols-3"}`}
											>
												<ActionButton
													disabled={!canMoveUp}
													onClick={() =>
														moveMedia(media.order, media.order - 1)
													}
												>
													위로
												</ActionButton>
												<ActionButton
													disabled={!canMoveDown}
													onClick={() =>
														moveMedia(media.order, media.order + 1)
													}
												>
													아래로
												</ActionButton>
												{canRotate ? (
													<ActionButton
														disabled={
															disabled ||
															media.preparedSource === rotatingSource
														}
														onClick={() => rotateMedia(media.order)}
														title="오른쪽으로 90도 회전"
													>
														회전
													</ActionButton>
												) : null}
												<ActionButton
													onClick={() => removeMedia(media.order)}
													tone="danger"
												>
													제거
												</ActionButton>
											</div>
										</div>
									</li>
								);
							})}
						</ol>
					) : (
						<p className="m-0 text-[var(--subtext0)] text-sm">
							사진이나 동영상을 1개 이상 선택해야 합니다.
						</p>
					)}
				</div>
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
				{error ? (
					<p className="m-0 text-[var(--red)] text-sm">{error}</p>
				) : null}
				<div className="flex flex-wrap justify-end gap-2">
					<ActionButton disabled={submitting} onClick={handleCancel}>
						취소
					</ActionButton>
					<ActionButton disabled={disabled} type="submit">
						저장
					</ActionButton>
				</div>
			</form>
			<LoadingOverlay label={processingLabel} open={isProcessingOverlayOpen} />
		</>
	);
}
