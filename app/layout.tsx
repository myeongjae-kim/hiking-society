import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Script from 'next/script';
import ClientDependencyContainer from './common/components/ClientDependencyContainer';
import { getWebtuiTheme, WEBTUI_THEME_COOKIE_NAME } from './common/theme/webtuiThemes';
import './globals.css';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

const title = '대학생(?)등산동아리';
const description = '회장만 빼면 대학생 취급받는 직장인 등산모임';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    images: [
      {
        url: '/thumbnail.webp',
        width: 1422,
        height: 964,
        alt: '대학생(?)등산동아리 썸네일',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/thumbnail.webp'],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = getWebtuiTheme(cookieStore.get(WEBTUI_THEME_COOKIE_NAME)?.value);

  return (
    <html lang="en" data-webtui-theme={theme} className="h-full antialiased">
      <head>
        <link href="https://cdn.myeongjae.kim/fonts/suit/SUIT.css" rel="stylesheet" />
      </head>
      <body className="flex min-h-full flex-col">
        <ClientDependencyContainer>{children}</ClientDependencyContainer>
        <Script id="reset-scroll-on-reload" strategy="beforeInteractive">
          {`(function(){try{var navigationEntries=performance.getEntriesByType('navigation');var navigationEntry=navigationEntries[0];if(!navigationEntry||navigationEntry.type!=='reload'){return;}if('scrollRestoration' in history){history.scrollRestoration='manual';}window.scrollTo(0,0);requestAnimationFrame(function(){window.scrollTo(0,0);});}catch(error){}})();`}
        </Script>
      </body>
    </html>
  );
}
