import { useEffect, useState, useRef, useCallback } from "react";
import { writeTextFile, watch, UnwatchFn } from "@tauri-apps/plugin-fs";
import { readFileText } from "../../../lib/filesystem";

// Compare ignoring line-ending and trailing-newline differences. Argon
// round-trips a saved file back to disk (push to Studio, then rewrite),
// usually only normalizing EOLs. Without this, our own save would look like
// an external change and prompt the user to reload their own edit.
const sameText = (a: string, b: string) =>
    a.replace(/\r\n/g, "\n").replace(/\n+$/, "") ===
    b.replace(/\r\n/g, "\n").replace(/\n+$/, "");

// While a sync tool (Argon in client mode) is also writing the file, our write
// can hit a transient Windows sharing violation. Retry a few times so the save
// lands in a window where the file isn't locked, instead of failing silently.
async function writeWithRetry(path: string, content: string): Promise<void> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            await writeTextFile(path, content);
            return;
        } catch (e) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, 80 * (attempt + 1)));
        }
    }
    throw lastErr;
}

export function useFileContent(path: string | null) {
    const [content, setContent] = useState("");
    const [savedContent, setSavedContent] = useState("");
    // A pending external change: the file changed on disk (e.g. Argon synced it
    // from Studio) and we're waiting for the user to decide. Holds the new disk
    // contents, or null when there's nothing to reconcile.
    const [externalContent, setExternalContent] = useState<string | null>(null);
    // Last save error, surfaced to the UI so failures aren't silent.
    const [saveError, setSaveError] = useState<string | null>(null);

    // Always-current refs so the watcher/save don't need these in deps.
    const contentRef = useRef(content);
    contentRef.current = content;
    const externalRef = useRef(externalContent);
    externalRef.current = externalContent;
    // What we believe is currently on disk. Updated on load, on our own save,
    // and once an external change is reloaded. Used to tell our own writes
    // apart from external ones and to avoid re-prompting for the same content.
    const diskRef = useRef("");

    // Load on open. From here on we never silently replace the buffer: external
    // writes are surfaced via `externalContent` and the user chooses what wins.
    useEffect(() => {
        if (!path) return;
        let alive = true;
        let unwatch: UnwatchFn | undefined;

        setExternalContent(null);

        readFileText(path)
            .then((c) => {
                if (!alive) return;
                diskRef.current = c;
                setContent(c);
                setSavedContent(c);
            })
            .catch(() => {
                if (!alive) return;
                diskRef.current = "";
                setContent("");
                setSavedContent("");
            });

        watch(
            path,
            () => {
                readFileText(path)
                    .then((disk) => {
                        if (!alive) return;
                        // Our own write, or Argon echoing it back with only
                        // EOL changes -> just track the new bytes, no prompt.
                        if (sameText(disk, diskRef.current)) {
                            diskRef.current = disk;
                            return;
                        }
                        diskRef.current = disk;
                        // The buffer already matches the new disk contents
                        // (ignoring EOLs): rebaseline, no prompt needed.
                        if (sameText(disk, contentRef.current)) {
                            setSavedContent(disk);
                            setExternalContent(null);
                            return;
                        }
                        // A real external change (edited in Studio): surface it
                        // and let the user decide. Never overwrite the open
                        // buffer on our own.
                        setExternalContent(disk);
                    })
                    .catch(() => {});
            },
            { delayMs: 150 }
        )
            .then((fn) => {
                if (alive) unwatch = fn;
                else fn();
            })
            .catch(() => {});

        return () => {
            alive = false;
            unwatch?.();
        };
    }, [path]);

    const save = useCallback(async () => {
        if (!path) return;
        const current = contentRef.current;
        try {
            await writeWithRetry(path, current);
        } catch (e) {
            setSaveError(String(e));
            throw e;
        }
        diskRef.current = current;
        setSavedContent(current);
        setSaveError(null);
        // Saving makes our version authoritative, clearing any pending prompt.
        setExternalContent(null);
    }, [path]);

    // Accept the disk version, replacing the buffer.
    const reloadFromDisk = useCallback(() => {
        const disk = externalRef.current;
        if (disk === null) return;
        diskRef.current = disk;
        setContent(disk);
        setSavedContent(disk);
        setExternalContent(null);
    }, []);

    // Keep the editor's version. The change stays dismissed until the file
    // changes on disk again; a save will push our version back out.
    const keepMine = useCallback(() => {
        setExternalContent(null);
    }, []);

    return {
        content,
        setContent,
        isDirty: content !== savedContent,
        save,
        saveError,
        externalChange: externalContent !== null,
        reloadFromDisk,
        keepMine,
    };
}
