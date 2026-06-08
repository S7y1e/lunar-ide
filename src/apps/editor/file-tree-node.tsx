import { FileNode, readDirectory } from "../../lib/filesystem";
import { VscChevronRight } from "react-icons/vsc";
import { useState } from "react";
import styles from "./style.module.scss";
import { resolveFileIcon } from "./file-icons";

type Props = {
    node: FileNode;
    depth?: number;
};

export default function FileTreeNode({ node, depth = 0 }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [children, setChildren] = useState<FileNode[]>([]);

    const handleClick = async () => {
        if (!node.isDir) return;

        if (!expanded && children.length === 0) {
            const result = await readDirectory(node.path);
            setChildren(result);
        }

        setExpanded(!expanded);
    };

    return (
        <div>
            <div
                className={styles.treeRow}
                style={{ paddingLeft: depth * 12 + 8 }}
                onClick={handleClick}
            >
                {node.isDir ? (
                    <VscChevronRight
                        className={`${styles.chevron} ${expanded ? styles.chevronOpen : ""}`}
                    />
                ) : (
                    <span className={styles.chevronSpacer} />
                )}

                <img
                    className={styles.nodeIcon}
                    src={resolveFileIcon(node, expanded)}
                    alt=""
                    draggable={false}
                />

                <span className={styles.nodeName}>{node.name}</span>
            </div>

            {expanded &&
                children.map((child) => (
                    <FileTreeNode key={child.path} node={child} depth={depth + 1} />
                ))}
        </div>
    );
}
