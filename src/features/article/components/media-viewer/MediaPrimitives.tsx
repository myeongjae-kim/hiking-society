import type { ArticleMedia } from "@/core/article/domain";

type InlineMediaFrameProps = {
	authorName: string;
	media: ArticleMedia | null;
};

export function VideoPlayOverlay() {
	return (
		<span
			aria-hidden="true"
			className="pointer-events-none absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[var(--overlay0)] bg-[color-mix(in_srgb,var(--surface0)_78%,transparent)] text-[var(--foreground0)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--background0)_45%,transparent),0_0.75rem_2rem_color-mix(in_srgb,var(--background0)_38%,transparent)] backdrop-blur-sm transition-transform duration-150 group-hover:scale-105 group-hover:bg-[color-mix(in_srgb,var(--surface1)_86%,transparent)]"
		>
			<span className="ml-1 size-0 border-y-[0.68rem] border-l-[1.05rem] border-y-transparent border-l-[var(--foreground0)]" />
		</span>
	);
}

export function InlineMediaFrame({ authorName, media }: InlineMediaFrameProps) {
	if (!media) {
		return (
			<span
				aria-hidden="true"
				className="block aspect-4/3 w-full bg-[var(--background0)]"
			/>
		);
	}

	return (
		<span className="relative block min-w-0">
			<img
				alt={`${authorName}의 산행 사진이나 동영상 ${media.order}`}
				className="block aspect-4/3 w-full bg-[var(--background0)] object-contain transition-[filter] group-hover:brightness-110"
				decoding="async"
				draggable={false}
				loading="lazy"
				src={media.thumbnailUrl ?? media.url}
			/>
			{media.mediaType === "video" ? (
				<>
					<VideoPlayOverlay />
					<span className="absolute right-2 bottom-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-1.5 py-0.5 font-mono text-xs text-[var(--foreground0)]">
						video
					</span>
				</>
			) : null}
		</span>
	);
}
