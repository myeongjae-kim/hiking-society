import {
	boxBorderClassName,
	gridStackClassName,
} from "#/features/shared/components/styles";

const skeletonBlockClassName = "animate-pulse bg-[var(--surface1)]";

function SkeletonBlock({ className }: { className: string }) {
	return (
		<span
			aria-hidden="true"
			className={`${skeletonBlockClassName} ${className}`}
		/>
	);
}

function FeedArticleSkeleton() {
	return (
		<article
			className={`!p-5 grid min-w-0 gap-5 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] ${boxBorderClassName}`}
			box-="round"
		>
			<header className="grid gap-2">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<SkeletonBlock className="h-[1.35rem] w-36" />
					<div className="flex flex-wrap gap-2">
						<SkeletonBlock className="h-[1.75rem] w-12 border border-[var(--overlay0)]" />
						<SkeletonBlock className="h-[1.75rem] w-12 border border-[var(--overlay0)]" />
					</div>
				</div>
				<div className="flex items-center gap-2">
					<SkeletonBlock className="h-8 w-8 border border-[var(--overlay0)]" />
					<SkeletonBlock className="h-[1.2rem] w-32" />
				</div>
				<SkeletonBlock className="h-[1rem] w-[min(100%,24rem)]" />
			</header>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
				<SkeletonBlock className="aspect-[4/3] min-h-44 border border-[var(--overlay0)]" />
				<SkeletonBlock className="hidden aspect-[4/3] min-h-44 border border-[var(--overlay0)] sm:block" />
			</div>

			<div className="grid gap-2">
				<SkeletonBlock className="h-[1.05rem] w-full" />
				<SkeletonBlock className="h-[1.05rem] w-[82%]" />
				<SkeletonBlock className="h-[1.05rem] w-[58%]" />
			</div>

			<SkeletonBlock className="h-[1.75rem] w-16 border border-[var(--overlay0)]" />

			<section className="grid gap-3 border-[var(--overlay0)] border-t pt-3.5">
				<SkeletonBlock className="h-[1.2rem] w-36" />
				<div className="grid gap-2">
					<SkeletonBlock className="h-[1rem] w-[72%]" />
					<SkeletonBlock className="ml-4 h-[1rem] w-[48%]" />
				</div>
				<SkeletonBlock className="h-9 w-full border border-[var(--overlay0)]" />
			</section>
		</article>
	);
}

function FeedStatusSkeleton() {
	return (
		<aside
			aria-hidden="true"
			className={`!p-4 lg:![position:sticky] grid gap-3 self-start bg-[var(--surface0)] lg:top-2 ${boxBorderClassName}`}
			box-="round"
		>
			<SkeletonBlock className="h-[1.2rem] w-36" />
			<div className="grid gap-2">
				{Array.from({ length: 7 }, (_, index) => (
					<div
						className="grid grid-cols-[5rem_minmax(0,1fr)] items-center gap-2"
						key={index}
					>
						<SkeletonBlock className="h-[0.9rem] w-16" />
						<SkeletonBlock className="h-[0.9rem] w-full" />
					</div>
				))}
			</div>
		</aside>
	);
}

export function FeedLoadingView() {
	return (
		<main
			aria-labelledby="feed-loading-title"
			className="min-h-svh bg-[length:2rem_2rem] bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] text-[var(--foreground0)]"
		>
			<h1 id="feed-loading-title" className="sr-only">
				피드로 이동 중
			</h1>

			<div aria-live="polite" role="status">
				<span className="sr-only">산행 기록을 불러오고 있습니다.</span>

				<header className="border-[var(--overlay0)] border-b bg-[color-mix(in_srgb,var(--background0)_92%,transparent)] px-4 py-3">
					<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
						<SkeletonBlock className="h-[1.35rem] w-48 max-w-full" />
						<nav
							className="ml-auto flex flex-wrap items-center gap-2"
							aria-hidden="true"
						>
							<SkeletonBlock className="h-[1rem] w-28" />
							<SkeletonBlock className="h-8 w-8 border border-[var(--overlay0)]" />
							<SkeletonBlock className="h-8 w-8 border border-[var(--overlay0)]" />
							<SkeletonBlock className="h-8 w-8 border border-[var(--overlay0)]" />
						</nav>
					</div>
				</header>

				<div className="mx-auto grid w-[min(100%,78rem)] grid-cols-1 gap-4 px-1.5 py-4 sm:px-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:p-5">
					<section className={gridStackClassName} aria-hidden="true">
						<section
							className={`!p-4 grid gap-4 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] ${boxBorderClassName}`}
							box-="round"
						>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<SkeletonBlock className="h-[1.35rem] w-44" />
								<SkeletonBlock className="h-[1.75rem] w-20 border border-[var(--overlay0)]" />
							</div>
						</section>

						<section className={gridStackClassName}>
							<header className="sticky top-2 z-20 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-2 py-1.5 shadow-[0_0.35rem_0_var(--background0)] sm:px-4 sm:py-3">
								<SkeletonBlock className="h-[1.75rem] w-36" />
								<div className="flex flex-wrap items-center justify-end gap-2">
									<SkeletonBlock className="h-[1.5rem] w-24 border border-[var(--overlay0)]" />
									<SkeletonBlock className="h-[1.75rem] w-16 border border-[var(--overlay0)]" />
									<SkeletonBlock className="h-[1.75rem] w-9 border border-[var(--overlay0)]" />
								</div>
							</header>
							<div className="grid gap-2 border border-[var(--overlay0)] border-t-0 bg-[color-mix(in_srgb,var(--surface0)_68%,transparent)] px-3 py-2 sm:px-4">
								<SkeletonBlock className="h-[1rem] w-[min(100%,34rem)]" />
								<SkeletonBlock className="h-[1rem] w-[min(86%,28rem)]" />
								<SkeletonBlock className="h-[1rem] w-[min(74%,24rem)]" />
							</div>

							<div className={gridStackClassName}>
								<FeedArticleSkeleton />
								<FeedArticleSkeleton />
							</div>
						</section>
					</section>

					<FeedStatusSkeleton />
				</div>

				<footer className="mx-auto w-[min(100%,78rem)] px-4 pb-6 font-mono text-[var(--subtext0)] text-sm leading-[1.45] lg:px-5">
					<div className="border-[var(--overlay0)] border-t pt-3 text-center">
						<p className="m-0 text-[var(--mauve)]">~ EOF ~</p>
						<SkeletonBlock className="mx-auto mt-2 block h-[1rem] w-56 max-w-full" />
					</div>
				</footer>
			</div>
		</main>
	);
}
