import FileMenu from "./file-menu";
import WindowControls from "./window-controls";
import { RecentProject } from "../../lib/projects";
import styles from "./style.module.scss";

type Props = {
    projects: RecentProject[];
    onOpenFolder: () => void;
    onOpenRecent: (path: string) => void;
    onCloseProject: () => void;
    hasProject: boolean;
};

export default function TopBar({
    projects,
    onOpenFolder,
    onOpenRecent,
    onCloseProject,
    hasProject,
}: Props) {
    return (
        <div className={styles.topbar} data-tauri-drag-region>
            <div className={styles.left}>
                <span className={styles.logo}>L</span>
                <FileMenu
                    projects={projects}
                    onOpenFolder={onOpenFolder}
                    onOpenRecent={onOpenRecent}
                    onCloseProject={onCloseProject}
                    hasProject={hasProject}
                />
            </div>

            <WindowControls />
        </div>
    );
}
