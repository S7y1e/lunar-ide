import { open } from "@tauri-apps/plugin-dialog";
import {
    BaseDirectory,
    create,
    readTextFile,
    writeTextFile,
} from "@tauri-apps/plugin-fs";
import { basename } from "@tauri-apps/api/path";

export type RecentProject = { name: string; path: string };

const RECENT_PROJECTS_FILE_NAME = "recent_projects.json";
const MAX_RECENT_PROJECTS = 3;

const saveRecentProjects = async (projects: RecentProject[]) => {
    await writeTextFile(RECENT_PROJECTS_FILE_NAME, JSON.stringify(projects), {
        baseDir: BaseDirectory.AppLocalData,
    });
};

export const getRecentProjectsFile = async (): Promise<RecentProject[]> => {
    try {
        const file = await readTextFile(RECENT_PROJECTS_FILE_NAME, {
            baseDir: BaseDirectory.AppLocalData,
        });

        if (file) {
            return JSON.parse(file);
        }
        return [];
    } catch (error) {
        const file = await create(RECENT_PROJECTS_FILE_NAME, {
            baseDir: BaseDirectory.AppLocalData,
        });
        await file.write(new TextEncoder().encode("[]"));
        await file.close();

        return [];
    }
};

const updateRecentProjects = async (path: string) => {
    const recentProjects = await getRecentProjectsFile();
    const filteredArray = recentProjects.filter(
        (recentProject) => recentProject.path !== path,
    );

    const name = await basename(path);
    filteredArray.unshift({ name, path });

    const trimmed = filteredArray.slice(0, MAX_RECENT_PROJECTS);
    await saveRecentProjects(trimmed);
};

export async function removeRecentProjectFromList(path: string) {
    const recentProjects = await getRecentProjectsFile();
    const filteredArray = recentProjects.filter(
        (recentProject) => recentProject.path !== path,
    );

    await saveRecentProjects(filteredArray);
}

export async function selectFolder(): Promise<string | null> {
    const path = await open({
        multiple: false,
        directory: true,
    });

    if (path) {
        await updateRecentProjects(path);
        return path;
    }
    return null;
}
