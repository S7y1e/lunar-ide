import { useRef, useState, type PointerEvent } from "react";
import styles from "./code-editor.module.scss";
import shared from "../styles/shared.module.scss";
import { resolveFileIcon } from "../file-icons";
import { VscClose } from "react-icons/vsc";

type Props = {
    files: string[];
    active: string | null;
    onSelect: (path: string) => void;
    onClose: (path: string) => void;
    onReorder: (from: number, to: number) => void;
};

const baseName = (path: string): string => path.split(/[\\/]/).pop() ?? path;

export default function EditorTabs({
    files,
    active,
    onSelect,
    onClose,
    onReorder,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragIndex = useRef<number | null>(null);
    const moved = useRef(false);
    const [draggingPath, setDraggingPath] = useState<string | null>(null);

    if (files.length === 0) return null;

    const targetIndexAt = (clientX: number): number => {
        const tabs = Array.from(
            containerRef.current?.querySelectorAll<HTMLElement>("[data-tab]") ?? []
        );
        for (let i = 0; i < tabs.length; i++) {
            const rect = tabs[i].getBoundingClientRect();
            if (clientX < rect.left + rect.width / 2) return i;
        }
        return tabs.length - 1;
    };

    const handlePointerDown = (e: PointerEvent<HTMLDivElement>, index: number) => {
        if (e.button !== 0) return;
        dragIndex.current = index;
        moved.current = false;
        setDraggingPath(files[index]);
        containerRef.current?.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (dragIndex.current === null) return;
        moved.current = true;
        const target = targetIndexAt(e.clientX);
        if (target !== dragIndex.current) {
            onReorder(dragIndex.current, target);
            dragIndex.current = target;
        }
    };

    const endDrag = () => {
        dragIndex.current = null;
        setDraggingPath(null);
    };

    return (
        <div
            ref={containerRef}
            className={styles.editorTabs}
            onWheel={(e) => {
                if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
        >
            {files.map((path, i) => {
                const name = baseName(path);
                return (
                    <div
                        key={path}
                        data-tab
                        className={`${styles.editorTab} ${
                            path === active ? styles.editorTabActive : ""
                        } ${path === draggingPath ? styles.editorTabDragging : ""}`}
                        onPointerDown={(e) => handlePointerDown(e, i)}
                        onClick={() => {
                            if (!moved.current) onSelect(path);
                        }}
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
                            onPointerDown={(e) => e.stopPropagation()}
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
