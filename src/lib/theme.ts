import { readSettings, subscribeSettings, SettingsValues } from "./settings";

export type ThemeName = "nord" | "dracula";

export const THEMES: ThemeName[] = ["nord", "dracula"];
export const DEFAULT_THEME: ThemeName = "nord";

export const THEME_SETTING_KEY = "lunar.theme";

/** Monaco editor theme id registered for each app theme. */
export const MONACO_THEME: Record<ThemeName, string> = {
    nord: "lunar-nord",
    dracula: "lunar-dracula",
};

function normalize(value: unknown): ThemeName {
    return value === "dracula" ? "dracula" : DEFAULT_THEME;
}

let current: ThemeName = DEFAULT_THEME;
const listeners = new Set<(theme: ThemeName) => void>();

/** Read the active theme from the persisted settings (sync best-effort). */
export function getTheme(): ThemeName {
    return current;
}

/** Apply a theme by flipping the `data-theme` attribute and notifying listeners. */
export function applyTheme(theme: ThemeName): void {
    current = theme;
    document.documentElement.dataset.theme = theme;
    for (const listener of listeners) listener(theme);
}

/** Subscribe to theme changes. Returns an unsubscribe function. */
export function subscribeTheme(listener: (theme: ThemeName) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

/**
 * Read the current theme tokens from CSS custom properties so JS-rendered
 * surfaces (Monaco, xterm) can match the active palette.
 */
export function readToken(name: string): string {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(`--${name}`)
        .trim();
}

/** Load the saved theme and keep it in sync with settings changes. */
export async function initTheme(): Promise<void> {
    const apply = (values: SettingsValues) =>
        applyTheme(normalize(values[THEME_SETTING_KEY]));

    apply(await readSettings());
    subscribeSettings(apply);
}
