import { useEffect, useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import styles from "./editor.module.scss";
import ActivityBar from "./activity-bar/activity-bar";
import Sidebar from "./file-tree/sidebar";
import SearchPalette from "./search/search-palette";
import EditorTabs from "./code-editor/editor-tabs";
import EditorPane from "./code-editor/editor-pane";
import { ActivityViewId, DEFAULT_ACTIVITY_VIEW } from "./activity-bar/activity-views";

type Props = {
    path: string;
};

export default function Editor({ path }: Props) {
    const [currentWindow, setCurrentWindow] = useState<ActivityViewId | null>(
        DEFAULT_ACTIVITY_VIEW
    );
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [activeFile, setActiveFile] = useState<string | null>(null);
    const [paletteOpen, setPaletteOpen] = useState(false);

    const sidebarRef = usePanelRef();

    const openFile = (filePath: string) => {
        setOpenFiles((prev) =>
            prev.includes(filePath) ? prev : [...prev, filePath]
        );
        setActiveFile(filePath);
    };

    const reorderFiles = (from: number, to: number) => {
        setOpenFiles((prev) => {
            const next = [...prev];
            const [moved] = next.splice(from, 1);
            next.splice(to, 0, moved);
            return next;
        });
    };

    const closeFile = (filePath: string) => {
        const idx = openFiles.indexOf(filePath);
        const remaining = openFiles.filter((p) => p !== filePath);
        setOpenFiles(remaining);
        if (activeFile === filePath) {
            setActiveFile(remaining[idx] ?? remaining[idx - 1] ?? null);
        }
    };

    useEffect(() => {
        const panel = sidebarRef.current;
        if (!panel) return;
        if (currentWindow) panel.expand();
        else panel.collapse();
    }, [currentWindow]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
                e.preventDefault();
                setPaletteOpen(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return (
        <div className={styles.editor}>
            <ActivityBar onChange={setCurrentWindow} />

            <Group
                orientation="horizontal"
                className={styles.panels}
                resizeTargetMinimumSize={{ coarse: 20, fine: 12 }}
            >
                <Panel
                    panelRef={sidebarRef}
                    collapsible
                    collapsedSize={0}
                    defaultSize="260px"
                    minSize="180px"
                >
                    <Sidebar
                        currentWindow={currentWindow}
                        path={path}
                        onOpenFile={openFile}
                    />
                </Panel>

                {currentWindow && <Separator className={styles.handle} />}

                <Panel className={styles.main}>
                    <EditorTabs
                        files={openFiles}
                        active={activeFile}
                        onSelect={setActiveFile}
                        onClose={closeFile}
                        onReorder={reorderFiles}
                    />
                    <div className={styles.editorArea}>
                        <EditorPane path={activeFile} />
                    </div>
                </Panel>
            </Group>

            {paletteOpen && (
                <SearchPalette
                    path={path}
                    onClose={() => setPaletteOpen(false)}
                    onOpen={(file) => openFile(file.path)}
                />
            )}
        </div>
    );
}