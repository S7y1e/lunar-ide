import {
    BaseDirectory,
    exists,
    readDir,
    mkdir,
    remove,
    rename,
    writeTextFile,
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
