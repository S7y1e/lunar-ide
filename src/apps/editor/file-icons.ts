import { FileNode } from "../../lib/filesystem";

/**
 * Icons are from charmed-icons by Littensy (MIT).
 * See src/assets/icons/charmed/LICENSE.md.
 *
 * Vite eagerly resolves every SVG in the charmed folder to its URL, keyed by
 * the bare file name (without extension), e.g. ICONS["luau"] -> "/assets/luau.123.svg".
 */
const modules = import.meta.glob("../../assets/icons/charmed/*.svg", {
    eager: true,
    query: "?url",
    import: "default",
}) as Record<string, string>;

const ICONS: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
    const base = path.split("/").pop()!.replace(/\.svg$/, "");
    ICONS[base] = url;
}

// Generic fallbacks (always present in the asset folder).
const FILE_FALLBACK = "_file";
const FOLDER_FALLBACK = "_folder";
const FOLDER_OPEN_FALLBACK = "_folder_open";

/** Exact file name (lowercased) -> icon. Wins over extension matching. */
const BY_FILENAME: Record<string, string> = {
    ".gitignore": "git",
    ".gitattributes": "git",
    ".gitmodules": "git",
    ".luaurc": "luau",
    ".editorconfig": "config",
    license: "license",
    "license.md": "license",
    "license.txt": "license",
    licence: "license",
};

/** File extension (lowercased, no dot) -> icon. */
const BY_EXTENSION: Record<string, string> = {
    luau: "luau",
    lua: "lua",
    json: "json",
    jsonc: "json",
    toml: "toml",
    md: "markdown",
    markdown: "markdown",
    yml: "yaml",
    yaml: "yaml",
    txt: "text",
    lock: "lock",
    lockb: "lock",
    cfg: "config",
    conf: "config",
    ini: "config",
    png: "image",
    jpg: "image",
    jpeg: "image",
    gif: "image",
    webp: "image",
    bmp: "image",
    svg: "image",
    ico: "image",
};

/** Folder name (lowercased) -> folder icon suffix (folder_<suffix>[_open]). */
const BY_FOLDER_NAME: Record<string, string> = {
    src: "source",
    source: "source",
    luau: "luau",
    lua: "luau",
    roblox: "roblox",
    lune: "lune",
    json: "json",
    test: "test",
    tests: "test",
    spec: "test",
    __tests__: "test",
    types: "types",
    typings: "types",
    "@types": "types",
    node_modules: "node",
    assets: "assets",
    asset: "assets",
    static: "assets",
    public: "assets",
    config: "config",
    configs: "config",
    ".config": "config",
    ".github": "github",
    ".vscode": "vscode",
    docs: "docs",
    doc: "docs",
    documentation: "docs",
};

const url = (name: string, fallback: string): string =>
    ICONS[name] ?? ICONS[fallback];

const folderIcon = (name: string, expanded: boolean): string => {
    const suffix = BY_FOLDER_NAME[name.toLowerCase()];
    if (suffix) {
        const key = expanded ? `folder_${suffix}_open` : `folder_${suffix}`;
        // Fall back to the generic folder if a specific open/closed variant is missing.
        return url(key, expanded ? FOLDER_OPEN_FALLBACK : FOLDER_FALLBACK);
    }
    return url(expanded ? FOLDER_OPEN_FALLBACK : FOLDER_FALLBACK, FOLDER_FALLBACK);
};

const fileIcon = (name: string): string => {
    const lower = name.toLowerCase();

    const byName = BY_FILENAME[lower];
    if (byName) return url(byName, FILE_FALLBACK);

    // Match the longest known extension first (e.g. "scene.project.json" -> "json").
    const parts = lower.split(".");
    for (let i = 1; i < parts.length; i++) {
        const ext = parts.slice(i).join(".");
        const byExt = BY_EXTENSION[ext];
        if (byExt) return url(byExt, FILE_FALLBACK);
    }

    return ICONS[FILE_FALLBACK];
};

/** Resolves the charmed-icons SVG URL for a file-tree node. */
export const resolveFileIcon = (node: FileNode, expanded: boolean): string =>
    node.isDir ? folderIcon(node.name, expanded) : fileIcon(node.name);
