import { useEffect, useMemo, useState } from "react";
import { ProjectFile, walkProjectFiles } from "../../../lib/filesystem";

const MAX_RESULTS = 50;

const score = (file: ProjectFile, q: string): number => {
    const name = file.name.toLowerCase();
    const rel = file.relativePath.toLowerCase();
    if (name.startsWith(q)) return 100;
    if (name.includes(q)) return 60;
    if (rel.includes(q)) return 30;
    return 0;
};

export function useFileSearch(path: string) {
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);

    useEffect(() => {
        walkProjectFiles(path).then(setFiles);
    }, [path]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return files.slice(0, MAX_RESULTS);
        return files
            .map((file) => ({ file, s: score(file, q) }))
            .filter((x) => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, MAX_RESULTS)
            .map((x) => x.file);
    }, [files, query]);

    useEffect(() => {
        setActive(0);
    }, [query]);

    const moveActive = (delta: number) =>
        setActive((a) => Math.min(Math.max(a + delta, 0), results.length - 1));

    return { query, setQuery, results, active, setActive, moveActive };
}
