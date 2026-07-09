import ClientDependencyContainer from '#/shared/components/ClientDependencyContainer';
import NotFound from '#/shared/NotFoundView';
import { DEFAULT_WEBTUI_THEME } from '#/theme/webtuiThemes';
import { getCurrentTheme } from '#/auth/session.functions';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, Scripts } from '@tanstack/react-router';
import appCss from '#/styles/global.css?url';

const siteUrl =
  import.meta.env.VITE_SITE_URL ||
  (typeof process !== 'undefined' && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

const title = '대학생(?)등산동아리';
const description = '회장만 빼면 대학생 취급받는 직장인 등산모임';
const resetScrollOnReloadScript = `(function(){try{var navigationEntries=performance.getEntriesByType('navigation');var navigationEntry=navigationEntries[0];if(!navigationEntry||navigationEntry.type!=='reload'){return;}if('scrollRestoration' in history){history.scrollRestoration='manual';}window.scrollTo(0,0);requestAnimationFrame(function(){window.scrollTo(0,0);});}catch(error){}})();`;

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    links: [
      {
        href: '/favicon.ico',
        rel: 'icon',
      },
      {
        href: 'https://cdn.myeongjae.kim/fonts/suit/SUIT.css',
        rel: 'stylesheet',
      },
      {
        href: appCss,
        rel: 'stylesheet',
      },
    ],
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: `${siteUrl}/thumbnail.webp` },
      { property: 'og:image:width', content: '1422' },
      { property: 'og:image:height', content: '964' },
      { property: 'og:image:alt', content: '대학생(?)등산동아리 썸네일' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: `${siteUrl}/thumbnail.webp` },
    ],
  }),
  loader: async () => ({
    theme: await getCurrentTheme(),
  }),
  notFoundComponent: NotFound,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const loaderData = Route.useLoaderData();
  const theme = loaderData?.theme ?? DEFAULT_WEBTUI_THEME;

  return (
    <html lang="en" data-webtui-theme={theme} className="h-full antialiased">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: resetScrollOnReloadScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ClientDependencyContainer>{children}</ClientDependencyContainer>
        <Scripts />
      </body>
    </html>
  );
}
