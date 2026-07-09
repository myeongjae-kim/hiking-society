import Link from "#/features/shared/components/AppLink";

import { Command } from "#/features/shared/components/Command";
import { boxBorderClassName } from "#/features/shared/components/styles";

const notFoundImageUrl = "https://hike-cdn.myeongjae.kim/assets/404.webp";

export default function NotFound() {
	return (
		<main className="min-h-svh bg-[length:2rem_2rem] bg-[linear-gradient(var(--surface0)_1px,transparent_1px),linear-gradient(90deg,var(--surface0)_1px,transparent_1px),var(--background0)] text-[var(--foreground0)]">
			<section className="mx-auto grid min-h-svh w-[min(100%,68rem)] place-items-center p-4 lg:p-8">
				<div
					className={`!p-5 grid w-full gap-6 overflow-hidden bg-[color-mix(in_srgb,var(--background0)_94%,var(--surface0))] ${boxBorderClassName} md:grid-cols-[minmax(0,0.92fr)_minmax(18rem,1.08fr)] md:items-center lg:gap-8`}
					box-="round"
				>
					<div className="grid min-w-0 gap-5 md:py-4">
						<div className="grid gap-3">
							<Command>trail.find --status 404</Command>
							<p
								className="m-0 bg-linear-to-r from-[var(--blue)] to-[var(--green)] bg-clip-text font-mono text-[4.5rem] text-transparent leading-none tracking-normal sm:text-[6rem] lg:text-[7rem]"
								aria-label="404"
							>
								404
							</p>
							<h1 className="m-0 text-balance break-keep text-3xl text-[var(--blue)] leading-[1.15] sm:text-4xl">
								길을 잘못 든 것 같아요.
							</h1>
						</div>
						<p className="m-0 max-w-[34rem] text-pretty break-keep text-[var(--subtext0)] text-sm leading-[1.65] sm:text-base">
							요청한 페이지를 찾을 수 없습니다. 주소를 다시 확인하거나, 동아리
							입구에서 새로 출발해 주세요.
						</p>
						<div className="flex flex-wrap gap-2">
							<Link is-="button" size-="small" variant-="foreground1" href="/">
								홈으로 돌아가기
							</Link>
							<Link
								is-="button"
								size-="small"
								variant-="foreground1"
								href="/feed"
							>
								피드로 이동
							</Link>
						</div>
					</div>

					<figure className="m-0 grid min-w-0 gap-2">
						<div className="overflow-hidden border border-[var(--overlay0)] bg-[var(--surface0)]">
							<img
								src={notFoundImageUrl}
								alt="등산로를 찾지 못한 404 안내 이미지"
								width={1448}
								height={1086}
								className="h-auto w-full object-cover"
							/>
						</div>
						<figcaption className="m-0 font-mono text-[var(--overlay1)] text-xs leading-[1.45]">
							route: unknown / next checkpoint: home
						</figcaption>
					</figure>
				</div>
			</section>
		</main>
	);
}
