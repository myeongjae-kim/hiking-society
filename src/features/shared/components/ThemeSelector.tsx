"use client";

import * as Select from "@radix-ui/react-select";
import { useRef, useState } from "react";

import {
	getWebtuiTheme,
	WEBTUI_THEME_COOKIE_MAX_AGE_SECONDS,
	WEBTUI_THEME_COOKIE_NAME,
	webtuiThemeGroups,
} from "#/theme/webtuiThemes";

type ThemeSelectorProps = {
	autoOpenOnMount?: boolean;
	initialTheme: string;
};

function getInitialTheme(initialTheme: string) {
	if (typeof document === "undefined") {
		return getWebtuiTheme(initialTheme);
	}

	return getWebtuiTheme(
		document.documentElement.getAttribute("data-webtui-theme") ?? initialTheme,
	);
}

function persistTheme(theme: string) {
	document.documentElement.setAttribute("data-webtui-theme", theme);
	document.cookie = `${WEBTUI_THEME_COOKIE_NAME}=${encodeURIComponent(
		theme,
	)}; Path=/; Max-Age=${WEBTUI_THEME_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function ThemeSelector({
	autoOpenOnMount = false,
	initialTheme,
}: ThemeSelectorProps) {
	const keepOpenAfterSelectRef = useRef(false);
	const [open, setOpen] = useState(autoOpenOnMount);
	const [selectedTheme, setSelectedTheme] = useState(() =>
		getInitialTheme(initialTheme),
	);

	function handleThemeChange(nextValue: string) {
		const nextTheme = getWebtuiTheme(nextValue);

		keepOpenAfterSelectRef.current = true;
		setSelectedTheme(nextTheme);
		setOpen(true);
		persistTheme(nextTheme);
	}

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen && keepOpenAfterSelectRef.current) {
			keepOpenAfterSelectRef.current = false;
			setOpen(true);
			return;
		}

		keepOpenAfterSelectRef.current = false;
		setOpen(nextOpen);
	}

	return (
		<Select.Root
			open={open}
			value={selectedTheme}
			onOpenChange={handleOpenChange}
			onValueChange={handleThemeChange}
		>
			<Select.Trigger
				aria-label="테마 선택"
				className="!border !border-[var(--overlay0)] !bg-[var(--background1)] !bg-none !text-xs !text-[var(--foreground0)] hover:!bg-[var(--background2)] inline-flex h-7 w-full min-w-0 items-center justify-between gap-2 px-2 font-mono leading-none focus:font-normal focus:no-underline focus-visible:outline-2 focus-visible:outline-[var(--blue)] focus-visible:outline-offset-2 sm:min-w-[12rem]"
			>
				<span className="text-[var(--subtext0)]">테마</span>
				<span className="min-w-0 truncate">
					<Select.Value />
				</span>
				<Select.Icon className="text-[var(--subtext0)]" aria-hidden="true">
					v
				</Select.Icon>
			</Select.Trigger>
			<Select.Portal>
				<Select.Content
					className="z-[70] max-h-[min(26rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden border border-[var(--overlay0)] bg-[var(--background0)] text-[var(--foreground0)] shadow-[0.25rem_0.25rem_0_var(--surface0)]"
					position="popper"
					sideOffset={6}
				>
					<Select.Viewport className="p-1">
						{webtuiThemeGroups.map((group) => (
							<Select.Group key={group.label}>
								<Select.Label className="px-2 pt-2 pb-1 font-mono text-[0.68rem] text-[var(--subtext0)] uppercase leading-none">
									{group.label}
								</Select.Label>
								{group.options.map((option) => (
									<Select.Item
										className="relative flex min-h-7 cursor-pointer select-none items-center px-7 py-1.5 font-mono text-xs leading-none outline-none data-[highlighted]:bg-[var(--surface0)] data-[highlighted]:text-[var(--foreground0)]"
										key={option.id}
										value={option.id}
									>
										<Select.ItemIndicator className="absolute left-2 text-[var(--green)]">
											*
										</Select.ItemIndicator>
										<Select.ItemText>
											{group.label === "Base" || group.label === option.label
												? option.label
												: `${group.label} ${option.label}`}
										</Select.ItemText>
									</Select.Item>
								))}
							</Select.Group>
						))}
					</Select.Viewport>
				</Select.Content>
			</Select.Portal>
		</Select.Root>
	);
}
