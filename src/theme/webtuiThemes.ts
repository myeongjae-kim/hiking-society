export const WEBTUI_THEME_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const WEBTUI_THEME_COOKIE_NAME = "webtui-theme";
export const DEFAULT_WEBTUI_THEME = "catppuccin-mocha";

export type WebtuiThemeOption = {
	id: string;
	label: string;
};

export type WebtuiThemeGroup = {
	label: string;
	options: WebtuiThemeOption[];
};

export const webtuiThemeGroups = [
	{
		label: "Base",
		options: [
			{ id: "dark", label: "Dark" },
			{ id: "light", label: "Light" },
		],
	},
	{
		label: "Catppuccin",
		options: [
			{ id: "catppuccin-mocha", label: "Mocha" },
			{ id: "catppuccin-macchiato", label: "Macchiato" },
			{ id: "catppuccin-frappe", label: "Frappe" },
			{ id: "catppuccin-latte", label: "Latte" },
		],
	},
	{
		label: "Everforest",
		options: [
			{ id: "everforest-dark-hard", label: "Dark Hard" },
			{ id: "everforest-dark-medium", label: "Dark Medium" },
			{ id: "everforest-dark-soft", label: "Dark Soft" },
			{ id: "everforest-light-hard", label: "Light Hard" },
			{ id: "everforest-light-medium", label: "Light Medium" },
			{ id: "everforest-light-soft", label: "Light Soft" },
		],
	},
	{
		label: "Gruvbox",
		options: [
			{ id: "gruvbox-dark-hard", label: "Dark Hard" },
			{ id: "gruvbox-dark-medium", label: "Dark Medium" },
			{ id: "gruvbox-dark-soft", label: "Dark Soft" },
			{ id: "gruvbox-light-hard", label: "Light Hard" },
			{ id: "gruvbox-light-medium", label: "Light Medium" },
			{ id: "gruvbox-light-soft", label: "Light Soft" },
		],
	},
	{
		label: "Nord",
		options: [{ id: "nord", label: "Nord" }],
	},
	{
		label: "Osmium",
		options: [{ id: "osmium", label: "Osmium" }],
	},
	{
		label: "Vitesse",
		options: [
			{ id: "vitesse-dark", label: "Dark" },
			{ id: "vitesse-dark-soft", label: "Dark Soft" },
			{ id: "vitesse-black", label: "Black" },
			{ id: "vitesse-light", label: "Light" },
			{ id: "vitesse-light-soft", label: "Light Soft" },
		],
	},
] as const satisfies readonly WebtuiThemeGroup[];

const webtuiThemeIds: ReadonlySet<string> = new Set(
	webtuiThemeGroups.flatMap((group) => group.options.map(({ id }) => id)),
);

export function getWebtuiTheme(value: string | null | undefined) {
	return value && webtuiThemeIds.has(value) ? value : DEFAULT_WEBTUI_THEME;
}
