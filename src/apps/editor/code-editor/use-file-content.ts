import { useEffect, useState, useRef, useCallback } from "react";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { readFileText } from "../../../lib/filesystem";

export function useFileContent(path: string | null) {
    const [content, setContent] = useState("");
    const [savedContent, setSavedContent] = useState("");
    // Always-current ref so save() doesn't need content in its dep array
    const contentRef = useRef(content);
    contentRef.current = content;

    useEffect(() => {
        if (!path) return;
        let alive = true;
        readFileText(path)
            .then((c) => {
                if (!alive) return;
                setContent(c);
                setSavedContent(c);
            })
            .catch(() => {
                if (!alive) return;
                setContent("");
                setSavedContent("");
            });
        return () => {
            alive = false;
        };
    }, [path]);

    const save = useCallback(async () => {
        if (!path) return;
        const current = contentRef.current;
        await writeTextFile(path, current);
        setSavedContent(current);
    }, [path]);

    return {
        content,
        setContent,
        isDirty: content !== savedContent,
        save,
    };
}
