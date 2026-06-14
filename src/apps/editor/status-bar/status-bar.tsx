import { IoSyncOutline } from "react-icons/io5";
import styles from "./status-bar.module.scss";
import { SyncStatus, SyncBackend } from "../sync/use-sync-server";
import { useProject } from "../../../lib/project";

type CursorPosition = { line: number; column: number };

type Props = {
    status: SyncStatus;
    backend: SyncBackend;
    port: number;
    cursor: CursorPosition | null;
    onClick: () => void;
};

const BACKEND_LABEL: Record<SyncBackend, string> = {
    rojo: "Rojo",
    argon: "Argon",
};

export default function StatusBar({
    status,
    backend,
    port,
    cursor,
    onClick,
}: Props) {
    const project = useProject();
    const label =
        status === "running"
            ? `${BACKEND_LABEL[backend]} · :${port}`
            : status === "error"
              ? "Sync error"
              : "Sync stopped";

    const title =
        status === "running"
            ? `${BACKEND_LABEL[backend]} serving on port ${port}`
            : "Open Sync panel";

    return (
        <footer className={styles.statusBar}>
            {project && (
                <span className={styles.project} title={project.root}>
                    {project.name}
                </span>
            )}
            <button
                className={`${styles.item} ${styles[status]}`}
                onClick={onClick}
                title={title}
            >
                <IoSyncOutline
                    size={13}
                    className={status === "running" ? styles.spin : undefined}
                />
                <span>{label}</span>
            </button>

            {cursor && (
                <span className={styles.cursor}>
                    Ln {cursor.line}, Col {cursor.column}
                </span>
            )}
        </footer>
    );
}
