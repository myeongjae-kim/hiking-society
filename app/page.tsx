import type { CSSProperties } from 'react';

const finalHeroTitle = '대학생(?)등산동아리';

type HeroTitleFrame = {
  before: string;
  after?: string;
  duration?: number;
  final?: boolean;
};

type TimedHeroTitleFrame = HeroTitleFrame & {
  delay: number;
  duration: number;
};

type HeroTitleLine = {
  afterCursor?: string;
  beforeCursor: string;
  showCursor?: boolean;
};

const heroTitleFrameDuration = 90;
const heroTitleEditFrameDuration = 120;
const studentBreak = '대학생';
const studentWithMarkerBreak = '대학생(?)';

const heroTitleFrameSteps: HeroTitleFrame[] = [
  { before: 'ㄷ' },
  { before: '대' },
  { before: '댛' },
  { before: '대하' },
  { before: '대학' },
  { before: '대핛' },
  { before: '대학새' },
  { before: '대학생' },
  { before: '대학생ㄷ' },
  { before: '대학생드' },
  { before: '대학생등' },
  { before: '대학생등ㅅ' },
  { before: '대학생등사' },
  { before: '대학생등산' },
  { before: '대학생등산ㄷ' },
  { before: '대학생등산도' },
  { before: '대학생등산동' },
  { before: '대학생등산동ㅇ' },
  { before: '대학생등산동아' },
  { before: '대학생등산동알' },
  { before: '대학생등산동아리', duration: 2000 },
  { before: '대학생등산동아', after: '리', duration: heroTitleEditFrameDuration },
  { before: '대학생등산동', after: '아리', duration: heroTitleEditFrameDuration },
  { before: '대학생등산', after: '동아리', duration: heroTitleEditFrameDuration },
  { before: '대학생등', after: '산동아리', duration: heroTitleEditFrameDuration },
  { before: '대학생', after: '등산동아리', duration: heroTitleEditFrameDuration * 3 },
  { before: '대학생(', after: '등산동아리', duration: heroTitleEditFrameDuration },
  { before: '대학생(?', after: '등산동아리', duration: heroTitleEditFrameDuration },
  { before: '대학생(?)', after: '등산동아리', duration: heroTitleEditFrameDuration * 10 },
  { before: finalHeroTitle, final: true },
];

const heroTitleFrames = heroTitleFrameSteps.reduce<TimedHeroTitleFrame[]>((frames, frame) => {
  const previousFrame = frames.at(-1);
  const delay = previousFrame ? previousFrame.delay + previousFrame.duration : 0;

  frames.push({
    ...frame,
    delay,
    duration: frame.duration ?? heroTitleFrameDuration,
  });

  return frames;
}, []);

function getHeroTitleBreakIndex(frame: HeroTitleFrame) {
  const after = frame.after ?? '';
  const fullText = `${frame.before}${after}`;

  if (fullText.startsWith(studentWithMarkerBreak)) {
    return studentWithMarkerBreak.length;
  }

  if (frame.before.startsWith('대학생(')) {
    return frame.before.length;
  }

  if (fullText.startsWith(`${studentBreak}등`) || (frame.before === studentBreak && after)) {
    return studentBreak.length;
  }

  return undefined;
}

function getHeroTitleLines(frame: HeroTitleFrame): HeroTitleLine[] {
  const after = frame.after ?? '';
  const fullText = `${frame.before}${after}`;
  const breakIndex = getHeroTitleBreakIndex(frame);
  const cursorIndex = frame.final ? undefined : frame.before.length;

  if (breakIndex === undefined) {
    return [
      {
        afterCursor: after,
        beforeCursor: frame.before,
        showCursor: !frame.final,
      },
    ];
  }

  if (cursorIndex !== undefined && cursorIndex <= breakIndex) {
    return [
      {
        afterCursor: fullText.slice(cursorIndex, breakIndex),
        beforeCursor: fullText.slice(0, cursorIndex),
        showCursor: true,
      },
      {
        beforeCursor: fullText.slice(breakIndex),
      },
    ];
  }

  if (cursorIndex !== undefined) {
    return [
      {
        beforeCursor: fullText.slice(0, breakIndex),
      },
      {
        afterCursor: fullText.slice(cursorIndex),
        beforeCursor: fullText.slice(breakIndex, cursorIndex),
        showCursor: true,
      },
    ];
  }

  return [
    {
      beforeCursor: fullText.slice(0, breakIndex),
    },
    {
      beforeCursor: fullText.slice(breakIndex),
    },
  ];
}

export default function Home() {
  const finalHeroTitleLines = getHeroTitleLines({ before: finalHeroTitle, final: true });

  return (
    <main className="teaser-shell" aria-labelledby="teaser-title">
      <section className="terminal-frame" box-="round">
        <span className="terminal-badge">Hiking Society &gt;&gt;</span>

        <div className="teaser-content">
          <p className="hero-title" aria-hidden="true">
            <span className="hero-title-reserve">
              {finalHeroTitleLines.map((line, index) => (
                <span className="hero-title-line" key={`${index}-${line.beforeCursor}`}>
                  {line.beforeCursor}
                </span>
              ))}
            </span>
            {heroTitleFrames.map((frame, index) => (
              <span
                className={`hero-title-frame ${frame.final ? 'hero-title-frame-final' : ''}`}
                key={`${index}-${frame.before}-${frame.after ?? ''}`}
                style={
                  {
                    '--delay': `${frame.delay}ms`,
                    '--duration': `${frame.duration}ms`,
                  } as CSSProperties
                }
              >
                {getHeroTitleLines(frame).map((line, lineIndex) => (
                  <span
                    className="hero-title-line"
                    key={`${lineIndex}-${line.beforeCursor}-${line.afterCursor ?? ''}`}
                  >
                    <span>{line.beforeCursor}</span>
                    {line.showCursor && <span className="hero-title-cursor">|</span>}
                    {line.afterCursor && <span>{line.afterCursor}</span>}
                  </span>
                ))}
              </span>
            ))}
          </p>

          <h1 id="teaser-title" className="sr-only">
            {finalHeroTitle}
          </h1>

          <p className="teaser-kicker text-2xl">Coming soon...</p>

          <button className="basecamp-button" size-="large" type="button" variant-="lavender">
            Enter Basecamp
          </button>
        </div>
      </section>
    </main>
  );
}
