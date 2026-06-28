const wordmark = String.raw`
 _   _ ___ _  _____ _   _  ____   ____   ___   ____ ___ _____ _______   __
| | | |_ _| |/ /_ _| \ | |/ ___| / ___| / _ \ / ___|_ _| ____|_   _\ \ / /
| |_| || || ' / | ||  \| | |  _  \___ \| | | | |    | ||  _|   | |  \ V /
|  _  || || . \ | || |\  | |_| |  ___) | |_| | |___ | || |___  | |   | |
|_| |_|___|_|\_\___|_| \_|\____| |____/ \___/ \____|___|_____| |_|   |_|
`;

export default function Home() {
  return (
    <main className="teaser-shell" aria-labelledby="teaser-title">
      <section className="terminal-frame" box-="square">
        <span className="terminal-badge">Hiking Society &gt;&gt;</span>

        <div className="teaser-content">
          <pre className="wordmark" aria-label="Hiking Society">
            {wordmark}
          </pre>

          <h1 id="teaser-title" className="sr-only">
            Hiking Society
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
