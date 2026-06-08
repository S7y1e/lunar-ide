import { BaseDirectory, exists } from "@tauri-apps/plugin-fs";

const appFolder = exists("lunarApp", {
    baseDir: BaseDirectory.Config,
});

export const UpdateRecentProjects = (path: string) => {};
