export default function Home() {
  return (
    <main className="teaser-shell" aria-labelledby="teaser-title">
      <section className="terminal-frame" box-="square">
        <span className="terminal-badge">Hiking Society &gt;&gt;</span>

        <div className="teaser-content">
          <p className="hero-title" aria-hidden="true">
            대학생(?)등산동아리
          </p>

          <h1 id="teaser-title" className="sr-only">
            대학생(?)등산동아리
          </h1>

          <p className="teaser-kicker">A quiet signal for people who prefer the long way up.</p>

          <div className="teaser-copy" box-="round">
            <p>
              Routes, rituals, and field notes for the ones who leave early, climb steady, and come
              back with better stories.
            </p>
          </div>

          <button className="basecamp-button" size-="large" type="button">
            Enter Basecamp
          </button>
        </div>
      </section>
    </main>
  );
}
