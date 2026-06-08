import styles from "./style.module.scss";

type Props = {
    path: string;
    onBack: () => void;
};

export default function Editor({ path, onBack }: Props) {
    return (
        <div className={styles.editor}>
            <button className={styles.backButton} onClick={onBack}>
                ← Back
            </button>
            <h1 className={styles.title}>Editor</h1>
            <p className={styles.path}>{path}</p>
        </div>
    );
}