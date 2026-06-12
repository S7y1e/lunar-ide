import { useEffect, useState, useRef, useCallback } from "react";
import { writeTextFile, watch, UnwatchFn } from "@tauri-apps/plugin-fs";
import { readFileText } from "../../../lib/filesystem";

// Normalize to LF before the text ever reaches Monaco. Argon rewrites files
// with CRLF on Windows; if that reaches the editor the model and luau-lsp
// disagree on column counts ("end character > line length" semantic-token
// errors) and highlighting/features break. Keeping the buffer LF-only makes
// the editor and the language server agree no matter how Argon stores it.
const toLf = (s: string) => s.replace(/\r\n/g, "\n");

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

// Reads can also fail with a sharing violation while the sync tool holds the
// file. Retry instead of falling back to empty content — treating a failed
// read as "" is what lets the editor later overwrite the real file with
// nothing.
async function readWithRetry(path: string): Promise<string> {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            return await readFileText(path);
        } catch (e) {
            lastErr = e;
            await new Promise((r) => setTimeout(r, 80 * (attempt + 1)));
        }
    }
    throw lastErr;
}

// Per-file buffer state, kept so switching tabs is synchronous. Without this,
// the disk read is async and for a moment the hook still holds the *previous*
// file's content under the new path — which the controlled Monaco editor would
// write into the new file's model, cross-contaminating open files.
type Snapshot = { content: string; saved: string; disk: string; external: string | null };

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
    const savedRef = useRef(savedContent);
    savedRef.current = savedContent;
    const externalRef = useRef(externalContent);
    externalRef.current = externalContent;
    // What we believe is currently on disk for the active path. Used to tell our
    // own writes apart from external ones and to avoid re-prompting.
    const diskRef = useRef("");

    // One snapshot per opened file, and the set of files already read once.
    const cacheRef = useRef<Map<string, Snapshot>>(new Map());
    const loadedRef = useRef<Set<string>>(new Set());

    // Swap buffers synchronously when the active file changes (React's "adjust
    // state during render" pattern), so the editor never sees another file's
    // content under this path.
    const [trackedPath, setTrackedPath] = useState(path);
    if (path !== trackedPath) {
        if (trackedPath) {
            cacheRef.current.set(trackedPath, {
                content,
                saved: savedContent,
                disk: diskRef.current,
                external: externalContent,
            });
        }
        const next = path ? cacheRef.current.get(path) : undefined;
        setTrackedPath(path);
        setContent(next?.content ?? "");
        setSavedContent(next?.saved ?? "");
        setExternalContent(next?.external ?? null);
        setSaveError(null);
        diskRef.current = next?.disk ?? "";
    }

    useEffect(() => {
        if (!path) return;
        let alive = true;
        let unwatch: UnwatchFn | undefined;

        const applyDisk = (raw: string) => {
            const c = toLf(raw);
            diskRef.current = c;
            setContent(c);
            setSavedContent(c);
        };

        // Reconcile a disk change against the buffer, VS Code style:
        //  - identical (modulo EOL) to what we have: no-op.
        //  - no unsaved edits: reload silently (nothing to lose).
        //  - unsaved edits present: surface a prompt; never clobber the buffer.
        const reconcile = (raw: string) => {
            const disk = toLf(raw);
            if (sameText(disk, diskRef.current)) {
                diskRef.current = disk;
                return;
            }
            diskRef.current = disk;
            if (sameText(disk, contentRef.current)) {
                setSavedContent(disk);
                setExternalContent(null);
                return;
            }
            const dirty = contentRef.current !== savedRef.current;
            if (!dirty) {
                setContent(disk);
                setSavedContent(disk);
                setExternalContent(null);
                return;
            }
            setExternalContent(disk);
        };

        // Load a file the first time it's opened (or recover if an earlier read
        // failed). Returning to an already-loaded file keeps its in-memory
        // buffer and only reconciles disk changes that happened in the
        // background. A read that never succeeds leaves the file *unloaded* so
        // save() refuses to touch it — far better than blanking it.
        const ingest = (raw: string) => {
            if (!loadedRef.current.has(path)) {
                loadedRef.current.add(path);
                applyDisk(raw);
            } else {
                reconcile(raw);
            }
        };

        readWithRetry(path)
            .then((raw) => {
                if (alive) ingest(raw);
            })
            .catch((e) => {
                if (alive) console.error("[file] read failed", path, e);
            });

        watch(
            path,
            () => {
                readWithRetry(path)
                    .then((raw) => {
                        if (alive) ingest(raw);
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
        // Never write a file we couldn't read: its buffer is empty/unknown and
        // saving would wipe the real content on disk.
        if (!loadedRef.current.has(path)) {
            setSaveError(
                "File not loaded yet (still locked by the sync tool?) — not saving to avoid overwriting it."
            );
            return;
        }
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
