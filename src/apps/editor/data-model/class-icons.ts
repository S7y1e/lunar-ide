import { IconType } from "react-icons";
import {
    VscGlobe,
    VscFolder,
    VscFileCode,
    VscSymbolNamespace,
    VscServer,
    VscDatabase,
    VscOrganization,
    VscLightbulb,
    VscUnmute,
    VscWindow,
    VscSymbolEvent,
    VscSymbolMethod,
    VscSymbolVariable,
} from "react-icons/vsc";

export type ClassIcon = { Icon: IconType; color: string };

// Specific classes worth their own glyph. Everything else falls back by suffix.
const BY_CLASS: Record<string, IconType> = {
    DataModel: VscGlobe,
    Workspace: VscServer,
    Players: VscOrganization,
    Lighting: VscLightbulb,
    SoundService: VscUnmute,
    ReplicatedStorage: VscDatabase,
    ReplicatedFirst: VscDatabase,
    ServerStorage: VscDatabase,
    ServerScriptService: VscServer,
    StarterGui: VscWindow,
    StarterPack: VscSymbolNamespace,
    StarterPlayer: VscOrganization,
    Folder: VscFolder,
    ModuleScript: VscSymbolMethod,
    ScreenGui: VscWindow,
    Frame: VscWindow,
};

function glyph(className: string): IconType {
    const specific = BY_CLASS[className];
    if (specific) return specific;
    if (className.endsWith("Script")) return VscFileCode;
    if (className.endsWith("Event") || className.endsWith("Function"))
        return VscSymbolEvent;
    if (className.endsWith("Value")) return VscSymbolVariable;
    return VscSymbolNamespace;
}

// Theme-aware accents (resolve per Nord/Dracula). Kept few and meaningful, like
// JetBrains icon coloring: scripts pop, folders stay neutral.
function tint(className: string): string {
    switch (className) {
        case "DataModel":
            return "var(--success)";
        case "Folder":
            return "var(--icon)";
        case "ModuleScript":
            return "var(--warning)";
        case "Script":
            return "var(--success)";
        case "LocalScript":
            return "var(--brand)";
    }
    if (className.endsWith("Script")) return "var(--accent)";
    if (className.endsWith("Event") || className.endsWith("Function"))
        return "var(--warning)";
    if (className.endsWith("Value")) return "var(--muted)";
    return "var(--accent)";
}

/** Icon + theme-aware color for a DataModel instance, keyed off its class. */
export function iconForClass(className: string): ClassIcon {
    return { Icon: glyph(className), color: tint(className) };
}
