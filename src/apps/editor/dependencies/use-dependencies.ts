import { useEffect, useState } from "react";
import { watch, type UnwatchFn } from "@tauri-apps/plugin-fs";
import {
    getProjectDependencies,
    type DependencyGraph,
} from "../../../lib/project";

const RELEVANT = /(\.luau|\.lua|sourcemap\.json)$/;

/**
 * The project's module dependency graph. Recomputed in Rust (`project_-
 * dependencies` lexes every module), refetched when a `.luau` or the sourcemap
 * changes. Also exposes a manual refresh for the impatient.
 */
export function useDependencies(rootPath: string) {
    const [graph, setGraph] = useState<DependencyGraph | null>(null);
    const [loading, setLoading] = useState(true);
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
        let active = true;
        let unwatch: UnwatchFn | null = null;

        const refresh = () => {
            getProjectDependencies()
                .then((g) => {
                    if (!active) return;
                    setGraph(g);
                    setLoading(false);
                })
                .catch(() => active && setLoading(false));
        };

        refresh();

        (async () => {
            try {
                const fn = await watch(
                    rootPath,
                    (event) => {
                        if (event.paths.some((p) => RELEVANT.test(p))) refresh();
                    },
                    { recursive: true, delayMs: 400 },
                );
                if (active) unwatch = fn;
                else fn();
            } catch (e) {
                console.warn("[deps] watch failed", e);
            }
        })();

        return () => {
            active = false;
            unwatch?.();
        };
    }, [rootPath, nonce]);

    return { graph, loading, refresh: () => setNonce((n) => n + 1) };
}
