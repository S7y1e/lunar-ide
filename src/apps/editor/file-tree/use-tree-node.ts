import { useEffect, useState } from "react";
import { confirm, message } from "@tauri-apps/plugin-dialog";
import {
    FileNode,
    readDirectory,
    createFile,
    createFolder,
    deleteEntry,
    renameEntry,
} from "../../../lib/filesystem";
import { MenuItem } from "./context-menu";

type Params = {
    node: FileNode;
    defaultExpanded: boolean;
    onChanged?: () => void;
};

export function useTreeNode({ node, defaultExpanded, onChanged }: Params) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const [children, setChildren] = useState<FileNode[]>([]);
    const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
    const [renaming, setRenaming] = useState(false);
    const [creating, setCreating] = useState<"file" | "folder" | null>(null);

    useEffect(() => {
        if (defaultExpanded && node.isDir) {
            readDirectory(node.path).then(setChildren);
        }
    }, []);

    const reload = async () => setChildren(await readDirectory(node.path));

    const ensureLoaded = async () => {
        if (children.length === 0) setChildren(await readDirectory(node.path));
    };

    const toggle = async () => {
        if (!node.isDir) return;
        if (!expanded) await ensureLoaded();
        setExpanded(!expanded);
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

    const remove = async () => {
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
                  { label: "Delete", danger: true, onClick: remove },
              ]
            : []),
    ];

    return {
        expanded,
        children,
        menu,
        renaming,
        creating,
        setMenu,
        setRenaming,
        setCreating,
        toggle,
        reload,
        submitCreate,
        submitRename,
        menuItems,
    };
}
