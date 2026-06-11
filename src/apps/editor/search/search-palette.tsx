import { type KeyboardEvent } from "react";
import styles from "./search.module.scss";
import { ProjectFile } from "../../../lib/filesystem";
import { useFileSearch } from "./use-file-search";
import PaletteTabs from "./palette-tabs";
import PaletteResult from "./palette-result";

type Props = {
    path: string;
    onClose: () => void;
    onOpen: (file: ProjectFile) => void;
};

export default function SearchPalette({ path, onClose, onOpen }: Props) {
    const { query, setQuery, results, active, setActive, moveActive } =
        useFileSearch(path);

    const choose = (index: number) => {
        const file = results[index];
        if (!file) return;
        onOpen(file);
        onClose();
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            moveActive(1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            moveActive(-1);
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
                <PaletteTabs />

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
                        <PaletteResult
                            key={file.path}
                            file={file}
                            query={query.trim()}
                            active={i === active}
                            onHover={() => setActive(i)}
                            onChoose={() => choose(i)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
