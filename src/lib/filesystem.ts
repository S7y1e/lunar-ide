import {
    BaseDirectory,
    exists,
    readDir,
    mkdir,
    remove,
    rename,
    writeTextFile,
    readTextFile,
} from "@tauri-apps/plugin-fs";
import { join, dirname } from "@tauri-apps/api/path";

const appFolder = exists("lunarApp", {
    baseDir: BaseDirectory.Config,
});

export type FileNode = {
    name: string;
    path: string;
    isDir: boolean;
};

export const readDirectory = async (parentPath: string): Promise<FileNode[]> => {
    const folder = await readDir(parentPath);

    const nodes: FileNode[] = [];
    for (const entry of folder) {
        const path = await join(parentPath, entry.name);
        nodes.push({
            name: entry.name,
            path,
            isDir: entry.isDirectory,
        });
    }

    nodes.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    return nodes;
};

export const createFile = async (parentPath: string, name: string): Promise<string> => {
    const path = await join(parentPath, name);
    await writeTextFile(path, "");
    return path;
};

export const createFolder = async (parentPath: string, name: string): Promise<string> => {
    const path = await join(parentPath, name);
    await mkdir(path);
    return path;
};

export const deleteEntry = async (path: string, isDir: boolean): Promise<void> => {
    await remove(path, { recursive: isDir });
};

export const renameEntry = async (oldPath: string, newName: string): Promise<string> => {
    const parent = await dirname(oldPath);
    const newPath = await join(parent, newName);
    await rename(oldPath, newPath);
    return newPath;
};

const IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "target",
    "build",
    ".idea",
]);

export type ProjectFile = {
    name: string;
    path: string;
    relativePath: string;
};

export const walkProjectFiles = async (
    root: string,
    max = 5000
): Promise<ProjectFile[]> => {
    const sep = root.includes("\\") ? "\\" : "/";
    const out: ProjectFile[] = [];
    const stack = [root];

    while (stack.length > 0 && out.length < max) {
        const dir = stack.pop()!;
        let entries;
        try {
            entries = await readDir(dir);
        } catch {
            continue;
        }
        for (const entry of entries) {
            const full = `${dir}${sep}${entry.name}`;
            if (entry.isDirectory) {
                if (!IGNORED_DIRS.has(entry.name)) stack.push(full);
            } else {
                const relativePath = full.slice(root.length).replace(/^[\\/]+/, "");
                out.push({ name: entry.name, path: full, relativePath });
            }
        }
    }

    return out;
};

export const readFileText = (path: string): Promise<string> => readTextFile(path);
