import { useState } from "react";

export function useOpenFiles() {
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);

    const openFile = (path: string) => {
        setOpenFiles((prev) => (prev.includes(path) ? prev : [...prev, path]));
        setActiveFile(path);
    };

    const closeFile = (path: string) => {
        const index = openFiles.indexOf(path);
        const remaining = openFiles.filter((p) => p !== path);
        setOpenFiles(remaining);
        if (activeFile === path) {
            setActiveFile(remaining[index] ?? remaining[index - 1] ?? null);
        }
    };

    const reorderFiles = (from: number, to: number) => {
        setOpenFiles((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    return {
        openFiles,
        activeFile,
        setActiveFile,
        openFile,
        closeFile,
        reorderFiles,
    };
}
