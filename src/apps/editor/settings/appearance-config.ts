import { Setting } from "./setting";
import { DEFAULT_THEME, THEMES } from "../../../lib/theme";

export const APPEARANCE_SETTINGS: Setting[] = [
    {
        key: "lunar.theme",
        tool: "Editor",
        category: "Appearance",
        label: "Theme",
        type: "string",
        default: DEFAULT_THEME,
        enum: [...THEMES],
        description: "Color theme for the whole IDE (editor, panels and terminal).",
    },
];
