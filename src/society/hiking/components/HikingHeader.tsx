import { ActionButton } from "#/society/shared/components/ActionButton";
import { inlineButtonClassName } from "#/society/shared/components/styles";
import type { Hiking } from "@/core/hiking/domain";
import type { MouseEvent } from "react";

import { getHikingDisplay } from "./hikingFormUtils";

type HikingHeaderProps = {
	canManageHiking: boolean;
	error?: string;
	hiking: Hiking;
	onAddArticle: () => void;
	onCopyLink: () => void;
	onDelete: () => void;
	onEdit: () => void;
};

export function HikingHeader({
	canManageHiking,
	error,
	hiking,
	onAddArticle,
	onCopyLink,
	onDelete,
	onEdit,
}: HikingHeaderProps) {
	const hikingDisplay = getHikingDisplay(hiking);

	const runMenuAction = (
		event: MouseEvent<HTMLButtonElement>,
		action: () => void,
	) => {
		event.currentTarget.closest("details")?.removeAttribute("open");
		action();
	};

	return (
		<>
			<header className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border border-[var(--overlay0)] bg-[var(--surface0)] px-2 py-1.5 shadow-[0_0.35rem_0_var(--background0)] sm:px-4 sm:py-3">
				<h2
					className="m-0 flex min-w-0 items-center gap-2 break-keep text-[1.25rem] text-[var(--blue)] leading-[1.1] tracking-normal sm:text-[1.75rem]"
					id={`hiking-${hiking.id}`}
				>
					<span className="min-w-0">
						{hiking.order}. {hiking.mountainName}
					</span>
					<button
						aria-label={`${hiking.mountainName} 산행 링크 복사`}
						className={`${inlineButtonClassName} !min-h-[1.65rem] !min-w-[1.65rem] !px-1 !py-1 sm:!min-h-[1.9rem] sm:!min-w-[1.9rem] aspect-square text-[0.95rem]`}
						onClick={onCopyLink}
						title="산행 링크 복사"
						type="button"
					>
						<svg
							aria-hidden="true"
							className="h-4 w-4"
							fill="none"
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							viewBox="0 0 24 24"
						>
							<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
							<path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71" />
						</svg>
					</button>
				</h2>
				<div className="ml-auto flex flex-wrap items-center justify-end gap-2">
					<span
						className="!text-[var(--yellow)] font-mono text-sm leading-none sm:text-base"
						is-="badge"
						variant-="background1"
					>
						{hikingDisplay.dateLabel}
					</span>
					<ActionButton onClick={onAddArticle}>글 작성</ActionButton>
					{canManageHiking ? (
						<details className="relative" is-="popover" position-="bottom left">
							<summary
								aria-label="산행 관리 메뉴"
								className="!h-auto !min-h-[1.75rem] !border !border-[var(--overlay0)] !bg-[var(--surface0)] !bg-none !px-1 !py-1 !text-sm !text-[var(--foreground0)] hover:!bg-[var(--surface1)] active:!bg-[var(--surface2)] active:!text-[var(--foreground0)] inline-flex min-w-[2.25rem] cursor-pointer list-none items-center justify-center whitespace-nowrap font-mono leading-[1.2] focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
								title="산행 관리 메뉴"
							>
								⋮
							</summary>
							<div className="grid min-w-24 gap-1 border border-[var(--overlay0)] bg-[var(--background1)] p-1 shadow-[0_0.35rem_0_var(--background0)]">
								<button
									className="!h-auto !min-h-0 !border-0 !bg-transparent !bg-none !text-[var(--foreground0)] hover:!bg-[var(--surface1)] w-full appearance-none whitespace-nowrap px-3 py-1.5 text-left font-mono text-sm leading-[1.2] focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2"
									onClick={(event) => runMenuAction(event, onEdit)}
									type="button"
								>
									수정
								</button>
								<button
									className="!h-auto !min-h-0 !border-0 !bg-transparent !bg-none !text-[var(--red)] hover:!bg-[var(--surface1)] w-full appearance-none whitespace-nowrap px-3 py-1.5 text-left font-mono text-sm leading-[1.2] focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2"
									onClick={(event) => runMenuAction(event, onDelete)}
									type="button"
								>
									삭제
								</button>
							</div>
						</details>
					) : null}
				</div>
			</header>
			<div className="grid gap-2 border border-[var(--overlay0)] border-t-0 bg-[color-mix(in_srgb,var(--surface0)_68%,transparent)] px-3 py-2 sm:px-4">
				<dl className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm leading-[1.35]">
					<div className="flex min-w-0 items-baseline gap-1.5">
						<dt className="m-0 shrink-0 text-[var(--subtext0)] text-xs">
							날짜/시간
						</dt>
						<dd className="m-0 min-w-0 text-[var(--foreground1)]">
							<span className="font-mono">{hikingDisplay.dateLabel}</span>
							<span className="px-1 text-[var(--subtext0)]">·</span>
							<span>{hikingDisplay.timeRangeLabel}</span>
							{hikingDisplay.durationLabel ? (
								<>
									<span className="px-1 text-[var(--subtext0)]">·</span>
									<span>{hikingDisplay.durationLabel}</span>
								</>
							) : null}
							<span className="px-1 text-[var(--subtext0)]">·</span>
							<span className="font-mono text-[var(--subtext0)] text-xs">
								{hikingDisplay.timezoneLabel}
							</span>
						</dd>
					</div>
					<div className="flex min-w-0 items-baseline gap-1.5">
						<dt className="m-0 shrink-0 text-[var(--subtext0)] text-xs">
							참석자
						</dt>
						<dd className="m-0 flex min-w-0 flex-wrap gap-1">
							{hikingDisplay.participants.length > 0 ? (
								hikingDisplay.participants.map((participant) => (
									<span
										className="border border-[var(--overlay0)] bg-[var(--surface1)] px-1.5 text-[var(--foreground0)] text-xs leading-[1.35]"
										key={participant}
									>
										{participant}
									</span>
								))
							) : (
								<span className="text-[var(--foreground1)]">참석자 미기록</span>
							)}
						</dd>
					</div>
					<div className="flex min-w-0 items-baseline gap-1.5">
						<dt className="m-0 shrink-0 text-[var(--subtext0)] text-xs">
							위치/고도
						</dt>
						<dd className="m-0 min-w-0 font-mono text-[var(--foreground1)]">
							위도 {hikingDisplay.latitudeLabel}
							<span className="px-1 text-[var(--subtext0)]">·</span>
							경도 {hikingDisplay.longitudeLabel}
							<span className="px-1 text-[var(--subtext0)]">·</span>
							고도 {hikingDisplay.altitudeLabel}
						</dd>
					</div>
					{hikingDisplay.restaurantLabel ? (
						<div className="flex min-w-0 items-baseline gap-1.5">
							<dt className="m-0 shrink-0 text-[var(--subtext0)] text-xs">
								뒤풀이
							</dt>
							<dd className="m-0 min-w-0 text-[var(--foreground1)] [overflow-wrap:anywhere]">
								{hikingDisplay.restaurantLabel}
							</dd>
						</div>
					) : null}
				</dl>
				{error ? (
					<p className="mt-2 mb-0 text-[var(--red)] text-sm">{error}</p>
				) : null}
			</div>
		</>
	);
}
