import { getCurrentWindow } from "@tauri-apps/api/window";
import styles from "./style.module.scss";

export default function WindowControls() {
    const appWindow = getCurrentWindow();

    return (
        <div className={styles.controls}>
            <button
                className={styles.control}
                onClick={() => appWindow.minimize()}
                aria-label="Minimize"
            >
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <rect x="0" y="4.5" width="10" height="1" fill="currentColor" />
                </svg>
            </button>
            <button
                className={styles.control}
                onClick={() => appWindow.toggleMaximize()}
                aria-label="Maximize"
            >
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1" />
                </svg>
            </button>
            <button
                className={`${styles.control} ${styles.close}`}
                onClick={() => appWindow.close()}
                aria-label="Close"
            >
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1" />
                    <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1" />
                </svg>
            </button>
        </div>
    );
}
