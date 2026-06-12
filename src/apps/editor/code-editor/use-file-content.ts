import { useEffect, useState, useRef, useCallback } from "react";
import { writeTextFile, watch, UnwatchFn } from "@tauri-apps/plugin-fs";
import { readFileText } from "../../../lib/filesystem";

export function useFileContent(path: string | null) {
    const [content, setContent] = useState("");
    const [savedContent, setSavedContent] = useState("");
    // Always-current ref so save() doesn't need content in its dep array
    const contentRef = useRef(content);
    contentRef.current = content;
    // What we believe is currently on disk. Updated on load, on our own save,
    // and whenever an external write is reconciled. The watcher compares disk
    // contents against this to tell our own writes apart from external ones.
    const diskRef = useRef("");

    const applyDisk = (c: string) => {
        diskRef.current = c;
        setContent(c);
        setSavedContent(c);
    };

    // Load on open, then keep the buffer in sync with the file on disk. Argon's
    // two-way sync writes the file from the Roblox side; without this the editor
    // would keep showing stale content and saving would silently clobber the
    // synced version. On an external change we reload it (the synced version
    // wins), which also resolves the divergence that was blocking saves.
    useEffect(() => {
        if (!path) return;
        let alive = true;
        let unwatch: UnwatchFn | undefined;

        readFileText(path)
            .then((c) => {
                if (alive) applyDisk(c);
            })
            .catch(() => {
                if (alive) applyDisk("");
            });

        watch(
            path,
            () => {
                readFileText(path)
                    .then((disk) => {
                        if (!alive) return;
                        // Our own save already matches diskRef -> ignore it.
                        if (disk === diskRef.current) return;
                        applyDisk(disk);
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
        await writeTextFile(path, current);
        diskRef.current = current;
        setSavedContent(current);
    }, [path]);

    return {
        content,
        setContent,
        isDirty: content !== savedContent,
        save,
    };
}
