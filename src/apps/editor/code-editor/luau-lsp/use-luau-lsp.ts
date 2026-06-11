import { useEffect } from "react";
import { resolveResource } from "@tauri-apps/api/path";
import { LuauLspClient } from "./client";
import { registerLuauLsp } from "./monaco-bridge";
import { buildConfigRoot } from "./config";
import { pathToUri } from "./uri";
import { readSettings } from "../../../../lib/settings";

const DEFINITIONS_RESOURCE = "resources/globalTypes.PluginSecurity.d.luau";

async function resolveDefinitions(): Promise<string | null> {
    try {
        return await resolveResource(DEFINITIONS_RESOURCE);
    } catch (e) {
        console.warn("[luau-lsp] could not resolve Roblox definitions", e);
        return null;
    }
}

export function useLuauLsp(rootPath: string) {
    useEffect(() => {
        let client: LuauLspClient | null = null;
        let dispose = () => {};
        let stopped = false;

        (async () => {
            const [values, definitions] = await Promise.all([
                readSettings(),
                resolveDefinitions(),
            ]);
            if (stopped) return;
            client = new LuauLspClient(
                pathToUri(rootPath),
                () => buildConfigRoot(values),
                definitions
            );
            dispose = registerLuauLsp(client);
            try {
                await client.start();
            } catch (e) {
                console.error("[luau-lsp] failed to start", e);
            }
        })();

        return () => {
            stopped = true;
            dispose();
            client?.stop().catch(() => {});
        };
    }, [rootPath]);
}
