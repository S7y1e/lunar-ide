import styles from "./style.module.scss";

type Props = {
    name: string;
    path: string;
    onOpen: (path: string) => void;
    onRemove: (path: string) => void;
};

export default function RecentProjectButton({ name, path, onOpen, onRemove }: Props) {
    return (
        <button className={styles.recentButton} onClick={() => onOpen(path)}>
            <span className={styles.recentInfo}>
                <span className={styles.cardTitle}>{name}</span>
                <span className={styles.cardDesc}>{path}</span>
            </span>
            <span className={styles.removeButton} onClick={(e) => {
                    e.stopPropagation();
                    onRemove(path);
                }}
            >×</span>
        </button>
    );
}