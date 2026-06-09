import {
    FileNode,
    readDirectory,
    createFile,
    createFolder,
    deleteEntry,
    renameEntry,
} from "../../lib/filesystem";
import { VscChevronRight } from "react-icons/vsc";
import { useContext, useEffect, useState, type MouseEvent } from "react";
import { confirm, message } from "@tauri-apps/plugin-dialog";
import styles from "./style.module.scss";
import { resolveFileIcon } from "./file-icons";
import ContextMenu, { MenuItem } from "./context-menu";
import { TreeSelectionContext } from "./tree-selection";

type Props = {
    node: FileNode;
    depth?: number;
    defaultExpanded?: boolean;
    onChanged?: () => void;
};

export default function FileTreeNode({
    node,
    depth = 0,
    defaultExpanded = false,
    onChanged,
}: Props) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [children, setChildren] = useState<FileNode[]>([]);
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const [renaming, setRenaming] = useState(false);
    const [creating, setCreating] = useState<"file" | "folder" | null>(null);
    const { selected, select } = useContext(TreeSelectionContext);

    useEffect(() => {
        if (defaultExpanded && node.isDir) {
            readDirectory(node.path).then(setChildren);
        }
    }, []);

    const reload = async () => {
        setChildren(await readDirectory(node.path));
    };

    const ensureLoaded = async () => {
        if (children.length === 0) setChildren(await readDirectory(node.path));
    };

    const handleClick = async () => {
        select(node.path);
        if (!node.isDir) return;
        if (!expanded) await ensureLoaded();
        setExpanded(!expanded);
    };

    const openMenu = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setMenu({ x: e.clientX, y: e.clientY });
    };

    const startCreate = async (kind: "file" | "folder") => {
        await ensureLoaded();
        setExpanded(true);
        setCreating(kind);
    };

    const submitCreate = async (name: string) => {
        const kind = creating;
        const trimmed = name.trim();
        setCreating(null);
        if (!trimmed || !kind) return;
        try {
            if (kind === "folder") await createFolder(node.path, trimmed);
            else await createFile(node.path, trimmed);
            await reload();
        } catch (err) {
            await message(String(err), { title: "Error", kind: "error" });
        }
    };

    const submitRename = async (name: string) => {
        const trimmed = name.trim();
        setRenaming(false);
        if (!trimmed || trimmed === node.name) return;
        try {
            await renameEntry(node.path, trimmed);
            onChanged?.();
        } catch (err) {
            await message(String(err), { title: "Error", kind: "error" });
        }
    };

    const handleDelete = async () => {
        const ok = await confirm(`Delete "${node.name}"?`, {
            title: "Delete",
            kind: "warning",
        });
        if (!ok) return;
        try {
            await deleteEntry(node.path, node.isDir);
            onChanged?.();
        } catch (err) {
            await message(String(err), { title: "Error", kind: "error" });
        }
    };

    const menuItems: MenuItem[] = [
        ...(node.isDir
            ? [
                  { label: "New File", onClick: () => startCreate("file") },
                  { label: "New Folder", onClick: () => startCreate("folder") },
              ]
            : []),
        ...(onChanged
            ? [
                  { label: "Rename", onClick: () => setRenaming(true) },
                  { label: "Delete", danger: true, onClick: handleDelete },
              ]
            : []),
    ];

    return (
        <div>
            <div
                className={`${styles.treeRow} ${selected === node.path ? styles.selected : ""}`}
                style={{ paddingLeft: depth * 12 + 8 }}
                onClick={handleClick}
                onContextMenu={openMenu}
            >
                {node.isDir ? (
                    <VscChevronRight
                        className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
                    />
                ) : (
                    <span className={styles.chevronSpacer} />
                )}

                <img
                    className={styles.nodeIcon}
                    src={resolveFileIcon(node, expanded)}
                    alt=""
                    draggable={false}
                />

                {renaming ? (
                    <NameInput
                        initial={node.name}
                        onSubmit={submitRename}
                        onCancel={() => setRenaming(false)}
                    />
                ) : (
                    <>
                        <span className={styles.nodeName}>{node.name}</span>
                        {depth === 0 && (
                            <span className={styles.rootPath}>{node.path}</span>
                        )}
                    </>
                )}
            </div>

            {expanded && (
                <>
                    {creating && (
                        <div
                            className={styles.treeRow}
                            style={{ paddingLeft: (depth + 1) * 12 + 8 }}
                        >
                            <span className={styles.chevronSpacer} />
                            <img
                                className={styles.nodeIcon}
                                src={resolveFileIcon(
                                    { name: "", path: "", isDir: creating === "folder" },
                                    false
                                )}
                                alt=""
                                draggable={false}
                            />
                            <NameInput
                                initial=""
                                onSubmit={submitCreate}
                                onCancel={() => setCreating(null)}
                            />
                        </div>
                    )}

                    {children.map((child) => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            onChanged={reload}
                        />
                    ))}
                </>
            )}

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    items={menuItems}
                    onClose={() => setMenu(null)}
                />
            )}
        </div>
    );
}

type NameInputProps = {
    initial: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
};

function NameInput({ initial, onSubmit, onCancel }: NameInputProps) {
    const [value, setValue] = useState(initial);

    return (
        <input
            className={styles.nodeInput}
            value={value}
            autoFocus
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit(value);
                else if (e.key === "Escape") onCancel();
            }}
            onBlur={onCancel}
        />
    );
}
