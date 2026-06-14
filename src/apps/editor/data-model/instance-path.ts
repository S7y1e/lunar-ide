import { type DataModelNode } from "../../../lib/project";

const SCRIPT_EXT = /\.(luau|lua)$/i;

/** Collision-proof key for an instance, from its chain of names to the root. */
export const keyOf = (chain: string[]): string => JSON.stringify(chain);

/** The source file backing an instance (a script), if any. */
export function scriptPath(node: DataModelNode): string | null {
    return node.filePaths?.find((p) => SCRIPT_EXT.test(p)) ?? null;
}

/**
 * Roblox instance path for a chain of names from the tree root, e.g.
 * `game.ReplicatedStorage.Shared.Foo`. When the root is the DataModel it is
 * addressed as `game`; otherwise the names are joined as-is.
 */
export function instancePath(chain: string[], rootIsGame: boolean): string {
    const tail = chain.slice(1);
    return (rootIsGame ? ["game", ...tail] : chain).join(".");
}

export function requireSnippet(chain: string[], rootIsGame: boolean): string {
    return `require(${instancePath(chain, rootIsGame)})`;
}

/** Normalize an absolute editor path to the sourcemap's relative, `/`-form. */
export function toRelative(root: string, absPath: string): string {
    const rel = absPath.startsWith(root) ? absPath.slice(root.length) : absPath;
    return rel.replace(/^[\\/]+/, "").replace(/\\/g, "/");
}

/**
 * The chain of names (root..target) of the instance whose file is `relFile`, or
 * null. Used to reveal the open editor file in the tree.
 */
export function findInstanceChain(
    node: DataModelNode,
    relFile: string,
    trail: string[] = [],
): string[] | null {
    const here = [...trail, node.name];
    if (node.filePaths?.some((p) => p.replace(/\\/g, "/") === relFile)) {
        return here;
    }
    for (const child of node.children) {
        const found = findInstanceChain(child, relFile, here);
        if (found) return found;
    }
    return null;
}

/** Keys to expand by default: the root and its direct services (depth < 2). */
export function defaultExpanded(root: DataModelNode): Set<string> {
    const keys = new Set<string>();
    const walk = (node: DataModelNode, trail: string[], depth: number) => {
        const here = [...trail, node.name];
        if (depth < 2) keys.add(keyOf(here));
        for (const child of node.children) walk(child, here, depth + 1);
    };
    walk(root, [], 0);
    return keys;
}
