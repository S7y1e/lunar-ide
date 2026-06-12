import { useEffect, useRef, useState } from "react";
import { Command, Child } from "@tauri-apps/plugin-shell";
import { readSettings } from "../../../lib/settings";

export type SyncBackend = "rojo" | "argon";
export type SyncStatus = "stopped" | "running" | "error";

const MAX_LOG_LINES = 500;

const DEFAULT_PORT: Record<SyncBackend, number> = {
    rojo: 34872,
    argon: 8000,
};

const SIDECAR: Record<SyncBackend, string> = {
    rojo: "binaries/rojo",
    argon: "binaries/argon",
};

function serveArgs(backend: SyncBackend, port: number): string[] {
    if (backend === "argon") {
        return ["serve", "--port", String(port), "--yes", "--color", "never"];
    }
    return ["serve", "--port", String(port)];
}

function runArgonConfig(key: string, value: string, cwd: string): Promise<void> {
    const command = Command.sidecar(
        "binaries/argon",
        ["config", key, value, "--config", "workspace", "--yes"],
        { cwd }
    );
    return new Promise((resolve) => {
        command.on("close", () => resolve());
        command.on("error", () => resolve());
        command.spawn().catch(() => resolve());
    });
}

async function applyArgonConfig(
    cwd: string,
    log: (line: string) => void
): Promise<void> {
    const values = await readSettings();
    const keys = Object.keys(values).filter((key) => key.startsWith("argon."));
    if (keys.length === 0) return;
    log(`Applying ${keys.length} Argon setting(s)...`);
    for (const fullKey of keys) {
        await runArgonConfig(fullKey.slice("argon.".length), String(values[fullKey]), cwd);
    }
}

export function useSyncServer(rootPath: string) {
    const [backend, setBackendState] = useState<SyncBackend>("rojo");
    const [status, setStatus] = useState<SyncStatus>("stopped");
    const [logs, setLogs] = useState<string[]>([]);
    const [port, setPort] = useState(DEFAULT_PORT.rojo);
    const childRef = useRef<Child | null>(null);

    const append = (line: string) =>
        setLogs((prev) => [...prev, line].slice(-MAX_LOG_LINES));

    const setBackend = (next: SyncBackend) => {
        if (childRef.current) return;
        setBackendState(next);
        setPort(DEFAULT_PORT[next]);
    };

    const start = async () => {
        if (childRef.current) return;
        setLogs([]);
        setStatus("running");
        try {
            if (backend === "argon") {
                await applyArgonConfig(rootPath, append);
            }
            const command = Command.sidecar(
                SIDECAR[backend],
                serveArgs(backend, port),
                { cwd: rootPath }
            );
            command.stdout.on("data", (line) => append(line));
            command.stderr.on("data", (line) => append(line));
            command.on("error", (error) => {
                append(String(error));
                setStatus("error");
            });
            command.on("close", () => {
                childRef.current = null;
                setStatus("stopped");
            });
            childRef.current = await command.spawn();
        } catch (error) {
            append(String(error));
            setStatus("error");
        }
    };

    const stop = async () => {
        await childRef.current?.kill();
        childRef.current = null;
        setStatus("stopped");
    };

    // Switching projects keeps this hook mounted and only changes `rootPath`,
    // so a server started for the old project would otherwise keep holding its
    // port. Tear it down whenever the project changes (and on unmount).
    //
    // Closing the window is handled by the editor's single close handler (it
    // calls `stop` before destroying the window), so we don't register our own
    // close listener here — two competing handlers both calling preventDefault
    // would deadlock the close.
    useEffect(() => {
        return () => {
            childRef.current?.kill();
            childRef.current = null;
            setStatus("stopped");
        };
    }, [rootPath]);

    return { backend, setBackend, status, logs, port, setPort, start, stop };
}
