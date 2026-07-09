import * as Dialog from "@radix-ui/react-dialog";

import type { ArticleMedia } from "@/core/article/domain";
import { VideoPlayOverlay } from "./MediaPrimitives";
import { getMediaTakenTimeLabel } from "./metadata";

type MediaThumbnailGridProps = {
	articleId: string;
	authorName: string;
	className: string;
	inlineCarousel: boolean;
	media: readonly ArticleMedia[];
	onOpenAt: (index: number) => void;
};

export function MediaThumbnailGrid({
	articleId,
	authorName,
	className,
	inlineCarousel,
	media,
	onOpenAt,
}: MediaThumbnailGridProps) {
	return (
		<div className={`${inlineCarousel ? "hidden sm:grid" : ""} ${className}`}>
			{media.map((item, index) => {
				const takenTime = getMediaTakenTimeLabel(item);

				return (
					<figure
						className="m-0 min-w-0 overflow-hidden border border-[var(--overlay0)] bg-[var(--surface0)]"
						key={`${articleId}-${item.order}`}
					>
						<Dialog.Trigger asChild>
							<button
								className="group block h-auto w-full appearance-none bg-transparent p-0 text-left leading-none focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2"
								onClick={() => {
									onOpenAt(index);
								}}
								type="button"
							>
								<span className="relative block">
									<img
										alt={`${authorName}의 산행 사진이나 동영상 ${item.order}`}
										className="block aspect-4/3 w-full bg-[var(--background0)] object-contain transition-[filter] group-hover:brightness-110"
										decoding="async"
										loading="lazy"
										src={item.thumbnailUrl ?? item.url}
									/>
									{item.mediaType === "video" ? (
										<>
											<VideoPlayOverlay />
											<span className="absolute right-2 bottom-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-1.5 py-0.5 font-mono text-[var(--foreground0)] text-xs">
												video
											</span>
										</>
									) : null}
								</span>
							</button>
						</Dialog.Trigger>
						<figcaption className="flex min-w-0 items-center justify-between gap-2 px-2 py-1 font-mono text-[0.8125rem] text-[var(--subtext0)] leading-snug">
							<span>
								{item.mediaType} {item.order}/{media.length}
							</span>
							{takenTime ? <span>{takenTime}</span> : null}
						</figcaption>
					</figure>
				);
			})}
		</div>
	);
}
