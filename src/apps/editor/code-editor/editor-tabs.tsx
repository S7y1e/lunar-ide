import styles from "./code-editor.module.scss";
import shared from "../styles/shared.module.scss";
import { resolveFileIcon } from "../file-icons";
import { VscClose } from "react-icons/vsc";

type Props = {
    files: string[];
    active: string | null;
    onSelect: (path: string) => void;
    onClose: (path: string) => void;
};

const baseName = (path: string): string => path.split(/[\\/]/).pop() ?? path;

export default function EditorTabs({ files, active, onSelect, onClose }: Props) {
    if (files.length === 0) return null;

    return (
        <div
            className={styles.editorTabs}
            onWheel={(e) => {
                if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
            }}
        >
            {files.map((path) => {
                const name = baseName(path);
                return (
                    <div
                        key={path}
                        className={`${styles.editorTab} ${
                            path === active ? styles.editorTabActive : ""
                        }`}
                        onClick={() => onSelect(path)}
                    >
                        <img
                            className={shared.nodeIcon}
                            src={resolveFileIcon({ name, path, isDir: false }, false)}
                            alt=""
                            draggable={false}
                        />
                        <span className={styles.editorTabName}>{name}</span>
                        <button
                            className={styles.editorTabClose}
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose(path);
                            }}
                            aria-label="Close"
                        >
                            <VscClose size={14} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
