import styles from "./style.module.scss";
import { RecentProject } from "../../lib/projects";
import RecentProjects from "./recent-project";
import MainCard from "./main-card";

type Props = {
    projects: RecentProject[];
    onOpenProject: (path: string) => void;
    onOpenFolder: () => void;
    onNewProject: () => void;
    onRemove: (path: string) => void;
};

export default function Home({
    projects,
    onOpenProject,
    onOpenFolder,
    onNewProject,
    onRemove,
}: Props) {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Welcome to Lunar</h1>
            <p className={styles.subtitle}>
                Personal Roblox game development IDE
            </p>

            <MainCard onOpen={onOpenFolder} onCreate={onNewProject} />
            <RecentProjects
                projects={projects}
                onOpen={onOpenProject}
                onRemove={onRemove}
            />
        </div>
    );
}
