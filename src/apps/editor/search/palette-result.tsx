import styles from "./search.module.scss";
import shared from "../styles/shared.module.scss";
import { ProjectFile } from "../../../lib/filesystem";
import { resolveFileIcon } from "../file-icons";
import Highlight from "./highlight";

type Props = {
    file: ProjectFile;
    query: string;
    active: boolean;
    onHover: () => void;
    onChoose: () => void;
};

export default function PaletteResult({
    file,
    query,
    active,
    onHover,
    onChoose,
}: Props) {
    return (
        <div
            className={`${styles.paletteItem} ${
                active ? styles.paletteItemActive : ""
            }`}
            onMouseEnter={onHover}
            onClick={onChoose}
        >
            <img
                className={shared.nodeIcon}
                src={resolveFileIcon(
                    { name: file.name, path: file.path, isDir: false },
                    false
                )}
                alt=""
                draggable={false}
            />
            <span className={styles.paletteName}>
                <Highlight text={file.name} query={query} />
            </span>
            <span className={styles.palettePath}>{file.relativePath}</span>
        </div>
    );
}
