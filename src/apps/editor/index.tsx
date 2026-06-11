import { useState } from "react";
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
                                onSelect={setActiveFile}
                                onClose={closeFile}
                                onReorder={reorderFiles}
                            />
                            <div className={styles.editorArea}>
                                <EditorPane path={activeFile} />
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
                            minSize="10%"
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
