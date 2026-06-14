import { LUAU_SETTINGS } from "../../settings/luau-lsp-config";
import { SettingsValues } from "../../../../lib/settings";

type ConfigNode = { [key: string]: unknown };

function setDeep(root: ConfigNode, key: string, value: unknown): void {
    const parts = key.split(".");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
        const next = node[parts[i]];
        if (typeof next !== "object" || next === null) node[parts[i]] = {};
        node = node[parts[i]] as ConfigNode;
    }
    node[parts[parts.length - 1]] = value;
}

export function buildConfigRoot(values: SettingsValues): ConfigNode {
    const root: ConfigNode = {};
    for (const setting of LUAU_SETTINGS) {
        const value = setting.key in values ? values[setting.key] : setting.default;
        setDeep(root, setting.key, value);
    }

    // Lunar owns sourcemap generation (see the `use-sourcemap` hook): it runs
    // its own `rojo sourcemap --watch`. Force luau-lsp to never spawn its own
    // generator, which would race ours writing the same file. It still reads the
    // on-disk sourcemap.json we keep fresh. luau-lsp defaults this to true, so we
    // must send false explicitly.
    setDeep(root, "luau-lsp.sourcemap.autogenerate", false);

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
