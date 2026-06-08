import styles from "./style.module.scss";
import {
    getRecentProjectsFile,
    RecentProject, removeRecentProjectFromList,
    selectFolder,
} from "../../lib/projects";
import RecentProjects from "./recent-project";
import React, { useEffect, useState } from "react";
import MainCard from "./main-card";

export default function Home() {
    const [projects, setProjects] = useState<RecentProject[]>([]);

    const loadProjects = () => {
        getRecentProjectsFile().then(setProjects);
    };


    useEffect(() => {
        loadProjects();
    }, []);

    const handleOpen = async () => {
        const ok = await selectFolder();
        if (ok) loadProjects();
    };

    const handleRemove = async (path: string) => {
        await removeRecentProjectFromList(path);
        loadProjects();
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Welcome to Lunar</h1>
            <p className={styles.subtitle}>Personal Roblox game development IDE</p>

            <MainCard onOpen={handleOpen} />
            <RecentProjects projects={projects} onRemove={handleRemove} />
        </div>
    );
}
