type FeedFooterProps = {
	articleCount: number;
	commentCount: number;
	hikingCount: number;
};

export function FeedFooter({
	articleCount,
	commentCount,
	hikingCount,
}: FeedFooterProps) {
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
