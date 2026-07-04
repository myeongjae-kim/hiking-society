export default function FeedLoading() {
  return (
    <main
      aria-labelledby="feed-loading-title"
      className="min-h-svh bg-[var(--background0)] px-3 py-5 text-[var(--foreground0)] lg:p-8"
    >
      <section
        aria-live="polite"
        className="grid min-h-[calc(100svh-5rem)] place-items-center overflow-hidden [--box-border-color:var(--overlay0)] [--box-border-width:1px] lg:min-h-[calc(100svh-4rem)]"
        box-="round"
        role="status"
      >
        <span className="absolute top-[0.2ch] left-[2ch] inline-block bg-[var(--peach)] px-[1ch] leading-[1lh] text-[var(--background0)]">
          Hiking Society &gt;&gt; feed
        </span>

        <div className="grid justify-items-center gap-[1lh] px-[2ch] text-center">
          <span is-="spinner" variant-="dots" />
          <h1
            id="feed-loading-title"
            className="m-0 font-mono text-lg leading-[1.2] text-[var(--foreground0)]"
          >
            피드로 이동 중
          </h1>
          <p className="m-0 font-mono text-sm leading-[1.4] text-[var(--subtext0)]">
            산행 기록을 불러오고 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
