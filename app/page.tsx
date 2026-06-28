import type { CSSProperties } from 'react';

const heroTitleFrames = [
  'ㄷ',
  '대',
  '댛',
  '대하',
  '대학',
  '대핛',
  '대학새',
  '대학생',
  '대학생ㄷ',
  '대학생드',
  '대학생등',
  '대학생등ㅅ',
  '대학생등사',
  '대학생등산',
  '대학생등산ㄷ',
  '대학생등산도',
  '대학생등산동',
  '대학생등산동ㅇ',
  '대학생등산동아',
  '대학생등산동알',
  '대학생등산동아리',
  '대학생(등산동아리',
  '대학생(?등산동아리',
  '대학생(?)등산동아리',
];

export default function Home() {
  const finalHeroTitle = heroTitleFrames.at(-1);

  return (
    <main className="teaser-shell" aria-labelledby="teaser-title">
      <section className="terminal-frame" box-="square">
        <span className="terminal-badge">Hiking Society &gt;&gt;</span>

        <div className="teaser-content">
          <p className="hero-title" aria-hidden="true">
            <span className="hero-title-reserve">{finalHeroTitle}</span>
            {heroTitleFrames.map((frame, index) => (
              <span
                className={`hero-title-frame ${
                  index === heroTitleFrames.length - 1 ? 'hero-title-frame-final' : ''
                }`}
                key={`${index}-${frame}`}
                style={{ '--frame': index } as CSSProperties}
              >
                {frame}
              </span>
            ))}
          </p>

          <h1 id="teaser-title" className="sr-only">
            {finalHeroTitle}
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
