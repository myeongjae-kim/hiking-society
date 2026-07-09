import Link from '#/features/shared/components/AppLink';

import { Command } from '#/features/shared/components/Command';
import { boxBorderClassName } from '#/features/shared/components/styles';
import type { AuthenticatedUser } from '@/core/auth/model/AuthenticatedUser';

import { getAuthorName } from '../utils/feed-crud-utils';
import { FeedTopbar } from './FeedTopbar';

type AssociateFeedNoticeProps = {
  user: AuthenticatedUser;
};

export function AssociateFeedNotice({ user }: AssociateFeedNoticeProps) {
  const currentAuthorName = getAuthorName(user);

  return (
    <main className="min-h-svh bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] bg-[length:2rem_2rem] text-[var(--foreground0)]">
      <FeedTopbar currentAuthorName={currentAuthorName} user={user} />
      <section className="mx-auto grid min-h-[calc(100svh-4rem)] w-[min(100%,64rem)] place-items-center p-4 lg:p-8">
        <div
          className={`grid w-full gap-6 bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] !p-5 ${boxBorderClassName} md:grid-cols-[minmax(0,1fr)_minmax(16rem,26rem)] md:items-center`}
          box-="round"
        >
          <div className="grid min-w-0 gap-4">
            <Command>feed.access --associate</Command>
            <h1 className="m-0 text-3xl leading-[1.15] text-[var(--blue)] sm:text-4xl">
              환영합니다! 준회원은 아직 피드를 조회할 수 없어요.
            </h1>
            <p className="m-0 text-sm leading-[1.6] text-[var(--subtext0)]">
              기존 멤버에게 연락해주세요. 가입 확인이 끝나면 이곳에서 산행 기록과 글을 볼 수
              있습니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link is-="button" size-="small" variant-="foreground1" href="/me">
                마이페이지
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="overflow-hidden border border-[var(--overlay0)] bg-[var(--surface0)]">
              <img
                src="https://hike-cdn.myeongjae.kim/assets/associate-block-image.webp"
                alt="작은 산, 잠긴 등산로 게이트"
                width={1448}
                height={1086}
                className="h-auto w-full object-cover"
              />
            </div>
            <figcaption className="m-0 font-mono text-xs leading-[1.45] text-[var(--overlay1)]">
              route: unknown / next checkpoint: home
            </figcaption>
          </div>
        </div>
      </section>
    </main>
  );
}
