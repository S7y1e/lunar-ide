import { useState, useEffect, useRef, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import * as monaco from "monaco-editor";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { Group, Panel, Separator } from "react-resizable-panels";
import styles from "./editor.module.scss";
import ActivityBar from "./activity-bar/activity-bar";
import { useActivityView } from "./activity-bar/use-activity-view";
import Sidebar from "./file-tree/sidebar";
import { useSidebarPanel } from "./file-tree/use-sidebar-panel";
import SearchPalette from "./search/search-palette";
import { useCommandPalette } from "./search/use-command-palette";
import EditorTabs from "./code-editor/editor-tabs";
import EditorPane from "./code-editor/editor-pane";
import { useOpenFiles } from "./code-editor/use-open-files";
import { useLuauLsp } from "./code-editor/luau-lsp/use-luau-lsp";
import { pathToUri } from "./code-editor/luau-lsp/uri";
import SyncPanel from "./sync/sync-panel";
import { useSyncServer } from "./sync/use-sync-server";
import ToolchainPanel from "./toolchain/toolchain-panel";
import { useRokit } from "./toolchain/use-rokit";
import TerminalView from "./terminal/terminal-view";
import { useTerminalPanel } from "./terminal/use-terminal-panel";
import SettingsView from "./settings/settings-view";

type Props = {
    path: string;
};

export default function Editor({ path }: Props) {
    const { currentView, toggleView } = useActivityView();
    const sidebarRef = useSidebarPanel(currentView);
    const palette = useCommandPalette();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const sync = useSyncServer(path);
    const toolchain = useRokit(path);
    const terminal = useTerminalPanel();

    useLuauLsp(path);
    const {
        openFiles,
        activeFile,
        setActiveFile,
        openFile,
        closeFile,
        reorderFiles,
    } = useOpenFiles();

    // Track which files have unsaved changes
    const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set());

    const handleDirtyChange = useCallback((filePath: string, dirty: boolean) => {
        setDirtyFiles((prev) => {
            const hasDirty = prev.has(filePath);
            if (dirty === hasDirty) return prev;
            const next = new Set(prev);
            if (dirty) next.add(filePath);
            else next.delete(filePath);
            return next;
        });
    }, []);

    // Save all open files using Monaco's model store (authoritative content)
    const openFilesRef = useRef(openFiles);
    openFilesRef.current = openFiles;

    const saveAll = useCallback(async () => {
        const models = monaco.editor.getModels();
        await Promise.all(
            models.map(async (model) => {
                const uri = model.uri.toString();
                // Only save files that are open in the editor
                const filePath = openFilesRef.current.find(
                    (p) => pathToUri(p) === uri
                );
                if (filePath) {
                    await writeTextFile(filePath, model.getValue());
                }
            })
        );
    }, []);

    // Save all dirty files before the window closes
    const saveAllRef = useRef(saveAll);
    saveAllRef.current = saveAll;

    // Stop the sync server before closing so its sidecar (Rojo/Argon) doesn't
    // get orphaned and keep holding its port.
    const stopSyncRef = useRef(sync.stop);
    stopSyncRef.current = sync.stop;

    useEffect(() => {
        const win = getCurrentWindow();
        let unlisten: (() => void) | undefined;
        win.onCloseRequested(async (event) => {
            event.preventDefault();
            await saveAllRef.current();
            await stopSyncRef.current();
            await win.destroy();
        }).then((fn) => {
            unlisten = fn;
        });
        return () => unlisten?.();
    }, []);

    return (
        <div className={styles.editor}>
            <ActivityBar
                active={currentView}
                onSelect={toggleView}
                terminalOpen={terminal.open}
                onToggleTerminal={terminal.toggle}
                onOpenSettings={() => setSettingsOpen(true)}
            />

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
                    {currentView === "sync" ? (
                        <SyncPanel
                            backend={sync.backend}
                            onBackendChange={sync.setBackend}
                            status={sync.status}
                            logs={sync.logs}
                            port={sync.port}
                            onPortChange={sync.setPort}
                            onStart={sync.start}
                            onStop={sync.stop}
                        />
                    ) : currentView === "toolchain" ? (
                        <ToolchainPanel
                            tools={toolchain.tools}
                            hasManifest={toolchain.hasManifest}
                            busy={toolchain.busy}
                            logs={toolchain.logs}
                            onInstall={toolchain.install}
                            onUpdate={toolchain.update}
                            onInit={toolchain.init}
                            onAdd={toolchain.add}
                            onRemove={toolchain.remove}
                            onSetVersion={toolchain.setVersion}
                        />
                    ) : (
                        <Sidebar
                            currentView={currentView}
                            path={path}
                            onOpenFile={openFile}
                        />
                    )}
                </Panel>

                {currentView && <Separator className={styles.handle} />}

                <Panel className={styles.main}>
                    <Group orientation="vertical" className={styles.mainGroup}>
                        <Panel className={styles.editorPane}>
                            <EditorTabs
                                files={openFiles}
                                active={activeFile}
                                dirtyFiles={dirtyFiles}
                                onSelect={setActiveFile}
                                onClose={closeFile}
                                onReorder={reorderFiles}
                            />
                            <div className={styles.editorArea}>
                                <EditorPane
                                    path={activeFile}
                                    onDirtyChange={handleDirtyChange}
                                />
                            </div>
                        </Panel>

                        {terminal.open && (
                            <Separator className={styles.vHandle} />
                        )}

                        <Panel
                            panelRef={terminal.ref}
                            collapsible
                            collapsedSize={0}
                            defaultSize="30%"
                            minSize="20%"
                        >
                            <TerminalView cwd={path} onClose={terminal.close} />
                        </Panel>
                    </Group>
                </Panel>
            </Group>

            {palette.isOpen && (
                <SearchPalette
                    path={path}
                    onClose={palette.close}
                    onOpen={(file) => openFile(file.path)}
                />
            )}

            {settingsOpen && (
                <SettingsView onClose={() => setSettingsOpen(false)} />
            )}
        </div>
    );
}
