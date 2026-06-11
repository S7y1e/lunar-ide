import { type PointerEvent } from "react";
import styles from "./code-editor.module.scss";
import shared from "../styles/shared.module.scss";
import { resolveFileIcon } from "../file-icons";
import { VscClose, VscCircleFilled } from "react-icons/vsc";

type Props = {
    path: string;
    name: string;
    active: boolean;
    dirty: boolean;
    dragging: boolean;
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => void;
    onClose: () => void;
};

export default function EditorTab({
    path,
    name,
    active,
    dirty,
    dragging,
    onPointerDown,
    onClose,
}: Props) {
    return (
        <div
            data-tab
            className={`${styles.editorTab} ${active ? styles.editorTabActive : ""} ${
                dragging ? styles.editorTabDragging : ""
            }`}
            onPointerDown={onPointerDown}
        >
            <img
                className={shared.nodeIcon}
                src={resolveFileIcon({ name, path, isDir: false }, false)}
                alt=""
                draggable={false}
            />
            <span className={styles.editorTabName}>{name}</span>
            {dirty ? (
                <button
                    className={`${styles.editorTabClose} ${styles.editorTabDirty}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    aria-label="Unsaved changes — close"
                >
                    <VscCircleFilled size={10} />
                </button>
            ) : (
                <button
                    className={styles.editorTabClose}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    aria-label="Close"
                >
                    <VscClose size={14} />
                </button>
            )}
        </div>
    );
}
