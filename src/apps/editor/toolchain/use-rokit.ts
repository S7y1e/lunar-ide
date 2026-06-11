import { useEffect, useState } from "react";
import { Command } from "@tauri-apps/plugin-shell";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

export type RokitTool = { name: string; spec: string };

const MAX_LOG_LINES = 500;

function parseTools(toml: string): RokitTool[] {
    const tools: RokitTool[] = [];
    let inTools = false;
    for (const raw of toml.split(/\r?\n/)) {
        const line = raw.trim();
        if (line.startsWith("[")) {
            inTools = line === "[tools]";
            continue;
        }
        if (!inTools || !line || line.startsWith("#")) continue;
        const match = /^([\w-]+)\s*=\s*"([^"]+)"/.exec(line);
        if (match) tools.push({ name: match[1], spec: match[2] });
    }
    return tools;
}

function removeToolLine(toml: string, name: string): string {
    let inTools = false;
    const kept: string[] = [];
    for (const raw of toml.split(/\r?\n/)) {
        const line = raw.trim();
        if (line.startsWith("[")) {
            inTools = line === "[tools]";
            kept.push(raw);
            continue;
        }
        const match = /^([\w-]+)\s*=/.exec(line);
        if (inTools && match && match[1] === name) continue;
        kept.push(raw);
    }
    return kept.join("\n");
}

function setToolVersion(toml: string, name: string, version: string): string {
    let inTools = false;
    return toml
        .split(/\r?\n/)
        .map((raw) => {
            const line = raw.trim();
            if (line.startsWith("[")) {
                inTools = line === "[tools]";
                return raw;
            }
            const match = /^([\w-]+)\s*=\s*"([^"]+)"/.exec(line);
            if (inTools && match && match[1] === name) {
                const spec = match[2];
                const at = spec.lastIndexOf("@");
                const repo = at < 0 ? spec : spec.slice(0, at);
                return `${name} = "${repo}@${version}"`;
            }
            return raw;
        })
        .join("\n");
}

export function useRokit(rootPath: string) {
    const [tools, setTools] = useState<RokitTool[]>([]);
    const [hasManifest, setHasManifest] = useState(false);
    const [busy, setBusy] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const append = (line: string) =>
        setLogs((prev) => [...prev, line].slice(-MAX_LOG_LINES));

    const refresh = async () => {
        try {
            const manifest = await join(rootPath, "rokit.toml");
            setTools(parseTools(await readTextFile(manifest)));
            setHasManifest(true);
        } catch {
            setTools([]);
            setHasManifest(false);
        }
    };

    useEffect(() => {
        refresh();
    }, [rootPath]);

    const run = (args: string[]) =>
        new Promise<void>((resolve) => {
            const command = Command.sidecar("binaries/rokit", args, {
                cwd: rootPath,
            });
            command.stdout.on("data", append);
            command.stderr.on("data", append);
            command.on("error", (error) => {
                append(String(error));
                resolve();
            });
            command.on("close", () => resolve());
            command.spawn().catch((error) => {
                append(String(error));
                resolve();
            });
        });

    const exec = async (args: string[]) => {
        if (busy) return;
        setBusy(true);
        await run(args);
        await refresh();
        setBusy(false);
    };

    const remove = async (name: string) => {
        if (busy) return;
        setBusy(true);
        try {
            const manifest = await join(rootPath, "rokit.toml");
            const text = await readTextFile(manifest);
            await writeTextFile(manifest, removeToolLine(text, name));
            append(`Removed ${name} from rokit.toml`);
        } catch (error) {
            append(String(error));
        }
        await refresh();
        setBusy(false);
    };

    const add = async (tool: string) => {
        if (busy) return;
        setBusy(true);
        await run(["trust", tool.split("@")[0]]);
        await run(["add", tool, "--force"]);
        await refresh();
        setBusy(false);
    };

    const setVersion = async (name: string, version: string) => {
        if (busy) return;
        setBusy(true);
        try {
            const manifest = await join(rootPath, "rokit.toml");
            const text = await readTextFile(manifest);
            await writeTextFile(manifest, setToolVersion(text, name, version));
            append(`Set ${name} to ${version}`);
        } catch (error) {
            append(String(error));
        }
        await run(["install", "--no-trust-check"]);
        await refresh();
        setBusy(false);
    };

    return {
        tools,
        hasManifest,
        busy,
        logs,
        install: () => exec(["install", "--no-trust-check"]),
        update: () => exec(["update"]),
        init: () => exec(["init"]),
        add,
        remove,
        setVersion,
    };
}
