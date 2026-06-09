import { useEffect, useState } from "react";
import TopBar from "./components/topbar";
import Home from "./apps/home";
import Editor from "./apps/editor";
import {
    getRecentProjectsFile,
    removeRecentProjectFromList,
    selectFolder,
    RecentProject,
} from "./lib/projects";
import {readDir} from "@tauri-apps/plugin-fs";

export default function App() {
    const [screen, setScreen] = useState<"home" | "editor">("home");
    const [currentPath, setCurrentPath] = useState<string | null>(null);
    const [projects, setProjects] = useState<RecentProject[]>([]);

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

    const openFolder = async () => {
        const path = await selectFolder();
        if (path) {
            loadProjects();
            readDir(path);
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
                onOpenRecent={openProject}
                onCloseProject={closeProject}
                hasProject={screen === "editor"}
            />
            {screen === "editor" && currentPath ? (
                <Editor path={currentPath} />
            ) : (
                <Home
                    projects={projects}
                    onOpenProject={openProject}
                    onOpenFolder={openFolder}
                    onRemove={removeProject}
                />
            )}
        </>
    );
}