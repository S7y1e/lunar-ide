import { useEffect, useState } from "react";
import { watch, type UnwatchFn } from "@tauri-apps/plugin-fs";
import { getProjectDataModel, type DataModelNode } from "../../../lib/project";

/**
 * The project's DataModel tree, kept in sync with the on-disk sourcemap.
 *
 * The Rust model owns the parse (`project_data_model`); this hook just knows
 * *when* to re-ask — it watches the project root for `sourcemap.json` writes
 * (our generator rewrites it on file changes) and refetches. Same split as the
 * sourcemap generator: Rust parses, the frontend reacts.
 */
export function useDataModel(rootPath: string) {
    const [tree, setTree] = useState<DataModelNode | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        let unwatch: UnwatchFn | null = null;

        const refresh = () => {
            getProjectDataModel()
                .then((next) => {
                    if (!active) return;
                    setTree(next);
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
                        if (event.paths.some((p) => p.endsWith("sourcemap.json"))) {
                            refresh();
                        }
                    },
                    { recursive: false, delayMs: 250 },
                );
                if (active) unwatch = fn;
                else fn();
            } catch (e) {
                console.warn("[datamodel] sourcemap watch failed", e);
            }
        })();

        return () => {
            active = false;
            unwatch?.();
        };
    }, [rootPath]);

    return { tree, loading };
}
