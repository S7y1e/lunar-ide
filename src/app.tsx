import { useEffect, useState } from "react";
import TopBar from "./components/topbar";
import Home from "./apps/home";
import Editor from "./apps/editor";
import {
    getRecentProjectsFile,
    removeRecentProjectFromList,
    selectFolder,
    createProject,
    NewProjectOptions,
    RecentProject,
} from "./lib/projects";
import NewProjectDialog from "./apps/home/new-project-dialog";
import {exists, readDir} from "@tauri-apps/plugin-fs";

export default function App() {
    const [screen, setScreen] = useState<"home" | "editor">("home");
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [projects, setProjects] = useState<RecentProject[]>([]);
    const [showNewProject, setShowNewProject] = useState(false);

    const loadProjects = () => {
        getRecentProjectsFile().then(setProjects);
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const openProject = (path: string) => {
        setCurrentPath(path);
        setScreen("editor");
    };

    // Opening from the recent list: the folder may have been deleted or moved
    // since it was saved, so verify it still exists before switching screens.
    const openRecent = async (path: string) => {
        if (!(await exists(path))) {
            await removeRecentProjectFromList(path);
            loadProjects();
            return;
        }
        openProject(path);
    };

    const openFolder = async () => {
        const path = await selectFolder();
        if (path) {
            loadProjects();
            readDir(path);
            openProject(path);
        }
    };

    const newProject = async (options: NewProjectOptions) => {
        setShowNewProject(false);
        const path = await createProject(options);
        if (path) {
            loadProjects();
            openProject(path);
        }
    };

    const closeProject = () => {
        setCurrentPath(null);
        setScreen("home");
        loadProjects();
    };

    const removeProject = async (path: string) => {
        await removeRecentProjectFromList(path);
        loadProjects();
    };

    return (
        <>
            <TopBar
                projects={projects}
                onOpenFolder={openFolder}
                onOpenRecent={openRecent}
                onCloseProject={closeProject}
                hasProject={screen === "editor"}
            />
            {screen === "editor" && currentPath ? (
                <Editor path={currentPath} />
            ) : (
                <Home
                    projects={projects}
                    onOpenProject={openRecent}
                    onOpenFolder={openFolder}
                    onNewProject={() => setShowNewProject(true)}
                    onRemove={removeProject}
                />
            )}
            {showNewProject && (
                <NewProjectDialog
                    onCreate={newProject}
                    onCancel={() => setShowNewProject(false)}
                />
            )}
        </>
    );
}