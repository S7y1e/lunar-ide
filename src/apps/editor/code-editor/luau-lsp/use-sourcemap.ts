import { useEffect } from "react";
import { Command, Child } from "@tauri-apps/plugin-shell";
import { invoke } from "@tauri-apps/api/core";
import { exists } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import { readSettings } from "../../../../lib/settings";
import { getProjectSnapshot } from "../../../../lib/project";

function setting<T>(values: Record<string, unknown>, key: string, fallback: T): T {
    return key in values ? (values[key] as T) : fallback;
}

// The sourcemap generator follows the project's declared backend, not a fixed
// tool: an Argon project's sourcemap is maintained by Argon (which also manages
// its project file), a Rojo project's by Rojo. Same on-disk sourcemap.json,
// owned end to end by Lunar either way.
function generator(backend: string, projectFile: string, sourcemapFile: string, includeNonScripts: boolean) {
    if (backend === "argon") {
        const args = ["sourcemap", projectFile, "--output", sourcemapFile, "--watch", "--yes", "--color", "never"];
        if (includeNonScripts) args.push("--non-scripts");
        return { sidecar: "binaries/argon", args };
    }
    const args = ["sourcemap", projectFile, "--output", sourcemapFile, "--watch"];
    if (includeNonScripts) args.push("--include-non-scripts");
    return { sidecar: "binaries/rojo", args };
}

/**
 * Lunar owns sourcemap generation: it runs its own `<backend> sourcemap --watch`
 * for the lifetime of the open project, keeping `sourcemap.json` fresh on disk.
 * The generator follows the manifest's sync backend (rojo/argon) so it agrees
 * with whoever manages the project file. The Rust Project Model parses that file
 * (`project_data_model`) and luau-lsp consumes it — luau-lsp's autogenerate is
 * forced off (config.ts), and on Argon the serve-side sourcemap is disabled (see
 * use-sync-server) so there's a single writer.
 *
 * No-op for a plain folder with no project file; nothing to generate there.
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

            const backend = snapshot?.syncBackend === "argon" ? "argon" : "rojo";
            const { sidecar, args } = generator(
                backend,
                projectFile,
                sourcemapFile,
                includeNonScripts,
            );

            const command = Command.sidecar(sidecar, args, { cwd: rootPath });
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
