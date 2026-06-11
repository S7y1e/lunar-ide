import { LUAU_SETTINGS } from "../../settings/luau-lsp-config";
import { SettingsValues } from "../../../../lib/settings";

type ConfigNode = { [key: string]: unknown };

export function buildConfigRoot(values: SettingsValues): ConfigNode {
    const root: ConfigNode = {};
    for (const setting of LUAU_SETTINGS) {
        const value = setting.key in values ? values[setting.key] : setting.default;
        const parts = setting.key.split(".");
        let node = root;
        for (let i = 0; i < parts.length - 1; i++) {
            const next = node[parts[i]];
            if (typeof next !== "object" || next === null) node[parts[i]] = {};
            node = node[parts[i]] as ConfigNode;
        }
        node[parts[parts.length - 1]] = value;
    }
    return root;
}

export function resolveSection(root: ConfigNode, section?: string): unknown {
    if (!section) return root;
    let node: unknown = root;
    for (const part of section.split(".")) {
        if (node === null || typeof node !== "object") return null;
        node = (node as ConfigNode)[part];
    }
    return node ?? null;
}
