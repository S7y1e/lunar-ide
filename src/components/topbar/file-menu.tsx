import { useState } from "react";
import { RecentProject } from "../../lib/projects";
import styles from "./style.module.scss";

type Props = {
    projects: RecentProject[];
    onOpenFolder: () => void;
    onOpenRecent: (path: string) => void;
    onCloseProject: () => void;
    hasProject: boolean;
};

export default function FileMenu({
    projects,
    onOpenFolder,
    onOpenRecent,
    onCloseProject,
    hasProject,
}: Props) {
    const [fileOpen, setFileOpen] = useState(false);
    const [recentOpen, setRecentOpen] = useState(false);

    const closeMenus = () => {
        setFileOpen(false);
        setRecentOpen(false);
    };

    const handle = (fn: () => void) => {
        fn();
        closeMenus();
    };

    return (
        <div className={styles.menu}>
            <button
                className={styles.menuButton}
                onClick={() => setFileOpen((v) => !v)}
            >
                File
            </button>

            {fileOpen && (
                <div className={styles.dropdown}>
                    <button
                        className={styles.dropdownItem}
                        onClick={() => handle(onOpenFolder)}
                    >
                        Open Folder
                    </button>

                    <div
                        className={styles.dropdownItem}
                        onMouseEnter={() => setRecentOpen(true)}
                        onMouseLeave={() => setRecentOpen(false)}
                    >
                        Open Recent ›
                        {recentOpen && (
                            <div className={styles.submenu}>
                                {projects.length === 0 ? (
                                    <span className={styles.empty}>
                                        No recent projects
                                    </span>
                                ) : (
                                    projects.map((p) => (
                                        <button
                                            key={p.path}
                                            className={styles.dropdownItem}
                                            onClick={() =>
                                                handle(() => onOpenRecent(p.path))
                                            }
                                        >
                                            {p.name}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        className={styles.dropdownItem}
                        onClick={() => handle(onCloseProject)}
                        disabled={!hasProject}
                    >
                        Close Project
                    </button>
                </div>
            )}
        </div>
    );
}
