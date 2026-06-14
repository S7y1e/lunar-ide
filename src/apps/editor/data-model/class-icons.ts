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

/**
 * An icon for a DataModel instance, keyed off its Roblox class. Specific classes
 * get their own glyph; the rest fall back by name suffix, then to a generic
 * instance icon. Coarse on purpose — can grow into true per-class Roblox icons.
 */
export function iconForClass(className: string): IconType {
    const specific = BY_CLASS[className];
    if (specific) return specific;

    if (className.endsWith("Script")) return VscFileCode; // Script, LocalScript
    if (className.endsWith("Event") || className.endsWith("Function"))
        return VscSymbolEvent;
    if (className.endsWith("Value")) return VscSymbolVariable;
    return VscSymbolNamespace;
}
