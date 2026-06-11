import styles from "./code-editor.module.scss";
import EditorTab from "./editor-tab";
import { useTabReorder } from "./use-tab-reorder";

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
    const { containerRef, draggingPath, startDrag, onPointerMove, endDrag, wasDragged } =
        useTabReorder(files, onReorder);

    if (files.length === 0) return null;

    return (
        <div
            ref={containerRef}
            className={styles.editorTabs}
            onWheel={(e) => {
                if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
            }}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
        >
            {files.map((path, i) => (
                <EditorTab
                    key={path}
                    path={path}
                    name={baseName(path)}
                    active={path === active}
                    dragging={path === draggingPath}
                    onPointerDown={(e) => startDrag(e, i)}
                    onSelect={() => {
                        if (!wasDragged()) onSelect(path);
                    }}
                    onClose={() => onClose(path)}
                />
            ))}
        </div>
    );
}
