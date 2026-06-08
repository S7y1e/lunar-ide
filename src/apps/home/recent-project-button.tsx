import styles from "./style.module.scss";
import React from "react";

type Props = { name: string; path: string; onRemove: (path: string) => void };

export default function RecentProjectButton({ name, path, onRemove}: Props) {
    return (
        <button className={styles.recentButton}>
            <span className={styles.recentInfo}>
                <span className={styles.cardTitle}>{name}</span>
                <span className={styles.cardDesc}>{path}</span>
            </span>
            <span className={styles.removeButton} onClick={() => onRemove(path)}>×</span>
        </button>
    );
}