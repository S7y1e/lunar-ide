import { useEffect } from "react";
import { Command, Child } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { exists } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { readSettings } from "../../../../lib/settings";
import { getProjectSnapshot } from "../../../../lib/project";

const SIDECAR = "binaries/rojo";

function setting<T>(values: Record<string, unknown>, key: string, fallback: T): T {
    return key in values ? (values[key] as T) : fallback;
}

/**
 * Lunar owns sourcemap generation: it runs its own `rojo sourcemap --watch` for
 * the lifetime of the open project, keeping `sourcemap.json` fresh on disk. The
 * Rust Project Model parses that file (`project_data_model`) and luau-lsp
 * consumes it — luau-lsp's own autogenerate is forced off (see config.ts) so the
 * two never race writing the same file.
 *
 * No-op for a plain folder with no Rojo project file; nothing to generate there.
 */
export function useSourcemap(rootPath: string) {
    useEffect(() => {
        let child: Child | null = null;
        let stopped = false;

        (async () => {
            const [values, snapshot] = await Promise.all([
                readSettings(),
                getProjectSnapshot(),
            ]);
            if (stopped) return;
            if (!setting(values, "luau-lsp.sourcemap.enabled", true)) return;

            // The project file is owned by the model (manifest-driven), not the
            // luau-lsp settings — so the generator and luau-lsp agree on it.
            const projectFile = snapshot?.projectFile ?? "default.project.json";
            const sourcemapFile = setting(
                values,
                "luau-lsp.sourcemap.sourcemapFile",
                "sourcemap.json",
            );
            const includeNonScripts = setting(
                values,
                "luau-lsp.sourcemap.includeNonScripts",
                true,
            );

            if (!(await exists(await join(rootPath, projectFile)))) return;
            if (stopped) return;

            const args = [
                "sourcemap",
                projectFile,
                "--output",
                sourcemapFile,
                "--watch",
            ];
            if (includeNonScripts) args.push("--include-non-scripts");

            const command = Command.sidecar(SIDECAR, args, { cwd: rootPath });
            command.stderr.on("data", (line) =>
                console.warn("[sourcemap]", line),
            );
            command.on("error", (error) =>
                console.error("[sourcemap]", error),
            );

            try {
                const spawned = await command.spawn();
                // Lost the race with cleanup: kill the fresh child immediately.
                if (stopped) {
                    spawned.kill().catch(() => {});
                    return;
                }
                child = spawned;
                // Tie the watcher to the app's lifetime so an abrupt exit can't
                // orphan it, mirroring how the sync server is handled.
                if (typeof child.pid === "number") {
                    invoke("assign_to_job", { pid: child.pid }).catch(() => {});
                }
            } catch (error) {
                console.error("[sourcemap] failed to start rojo", error);
            }
        })();

        return () => {
            stopped = true;
            child?.kill().catch(() => {});
            child = null;
        };
    }, [rootPath]);
}
