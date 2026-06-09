import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import styles from "./search.module.scss";
import shared from "../styles/shared.module.scss";
import { ProjectFile, walkProjectFiles } from "../../../lib/filesystem";
import { resolveFileIcon } from "../file-icons";

type Props = {
    path: string;
    onClose: () => void;
    onOpen: (file: ProjectFile) => void;
};

const TABS = ["All", "Classes", "Files", "Symbols", "Actions", "Text"];

const score = (file: ProjectFile, q: string): number => {
    const name = file.name.toLowerCase();
    const rel = file.relativePath.toLowerCase();
    if (name.startsWith(q)) return 100;
    if (name.includes(q)) return 60;
    if (rel.includes(q)) return 30;
    return 0;
};

export default function SearchPalette({ path, onClose, onOpen }: Props) {
    const [files, setFiles] = useState<ProjectFile[]>([]);
    const [query, setQuery] = useState("");
    const [active, setActive] = useState(0);

    useEffect(() => {
        walkProjectFiles(path).then(setFiles);
    }, [path]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return files.slice(0, 50);
        return files
            .map((file) => ({ file, s: score(file, q) }))
            .filter((x) => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, 50)
            .map((x) => x.file);
    }, [files, query]);

    useEffect(() => {
        setActive(0);
    }, [query]);

    const choose = (index: number) => {
        const file = results[index];
        if (!file) return;
        onOpen(file);
        onClose();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            choose(active);
        } else if (e.key === "Escape") {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div className={styles.paletteOverlay} onClick={onClose}>
            <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
                <div className={styles.paletteTabs}>
                    {TABS.map((tab) => (
                        <span
                            key={tab}
                            className={`${styles.paletteTab} ${
                                tab === "Files" ? styles.paletteTabActive : ""
                            }`}
                        >
                            {tab}
                        </span>
                    ))}
                </div>

                <input
                    className={styles.paletteInput}
                    value={query}
                    autoFocus
                    spellCheck={false}
                    placeholder="Search files by name"
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={onKeyDown}
                />

                <div className={styles.paletteResults}>
                    {results.map((file, i) => (
                        <div
                            key={file.path}
                            className={`${styles.paletteItem} ${
                                i === active ? styles.paletteItemActive : ""
                            }`}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => choose(i)}
                        >
                            <img
                                className={shared.nodeIcon}
                                src={resolveFileIcon(
                                    { name: file.name, path: file.path, isDir: false },
                                    false
                                )}
                                alt=""
                                draggable={false}
                            />
                            <span className={styles.paletteName}>
                                <Highlight text={file.name} q={query.trim()} />
                            </span>
                            <span className={styles.palettePath}>{file.relativePath}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Highlight({ text, q }: { text: string; q: string }) {
    if (!q) return <>{text}</>;
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return <>{text}</>;
    return (
        <>
            {text.slice(0, i)}
            <mark className={styles.paletteMark}>{text.slice(i, i + q.length)}</mark>
            {text.slice(i + q.length)}
        </>
    );
}
