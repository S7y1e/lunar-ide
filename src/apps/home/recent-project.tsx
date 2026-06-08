import RecentProjectButton from "./recent-project-button";
import { RecentProject } from "../../lib/projects";
import styles from "./style.module.scss";
import React from "react";

type Props = {
    projects: RecentProject[];
    onOpen: (path: string) => void;
    onRemove: (path: string) => void;
};

export default function RecentProjects({ projects, onOpen, onRemove }: Props) {
    return (
        <div className={styles.recent}>
            <p className={styles.recentHeading}>Recent Projects</p>

            <div className={styles.recentList}>
                {projects.map((project) => (
                    <RecentProjectButton
                        key={project.path}
                        name={project.name}
                        path={project.path}
                        onOpen={onOpen}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </div>
    );
}
