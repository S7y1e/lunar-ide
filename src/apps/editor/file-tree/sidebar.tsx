import style from "./file-tree.module.scss"
import FileTreeNode from "./file-tree-node";
import { ActivityViewId } from "../activity-bar/activity-views";
import { FileNode } from "../../../lib/filesystem";
import { useState } from "react";
import { TreeSelectionContext } from "./tree-selection";
import { VscChevronDown, VscCollapseAll, VscRefresh } from "react-icons/vsc";

type Props = {
    currentWindow: ActivityViewId | null;
    path: string;
    onOpenFile: (path: string) => void;
};

export default function Sidebar({ currentWindow, path, onOpenFile }: Props) {
    const [selected, setSelected] = useState<string | null>(null);
    const [treeKey, setTreeKey] = useState(0);

    if (!currentWindow) return null;

    const rootName = path.replace(/[\\/]+$/, "").split(/[\\/]/).pop() || path;
    const rootNode: FileNode = { name: rootName, path, isDir: true };

    const remountTree = () => setTreeKey((k) => k + 1);

    return (
        <div className={style.sidebar}>
            <div className={style.sidebarHeader}>
                <span className={style.sidebarTitle}>
                    <VscChevronDown size={14} />
                    Project
                </span>
                <span className={style.sidebarActions}>
                    <button
                        className={style.sidebarBtn}
                        onClick={remountTree}
                        title="Collapse All"
                        aria-label="Collapse All"
                    >
                        <VscCollapseAll size={16} />
                    </button>
                    <button
                        className={style.sidebarBtn}
                        onClick={remountTree}
                        title="Refresh"
                        aria-label="Refresh"
                    >
                        <VscRefresh size={16} />
                    </button>
                </span>
            </div>

            <div className={style.sidebarTree}>
                {currentWindow === "project" && (
                    <TreeSelectionContext.Provider
                        value={{ selected, select: setSelected, openFile: onOpenFile }}
                    >
                        <FileTreeNode
                            key={`${rootNode.path}-${treeKey}`}
                            node={rootNode}
                            defaultExpanded
                        />
                    </TreeSelectionContext.Provider>
                )}
            </div>
        </div>
    );
}
