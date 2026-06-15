import { useEffect, useRef, type MouseEvent } from "react";
import { VscChevronRight } from "react-icons/vsc";
import { join } from "@tauri-apps/api/path";
import { type DataModelNode } from "../../../lib/project";
import { iconForClass } from "./class-icons";
import { keyOf, scriptPath } from "./instance-path";
import styles from "./data-model.module.scss";

export type NodeContext = {
    node: DataModelNode;
    chain: string[];
    x: number;
    y: number;
};

type Props = {
    node: DataModelNode;
    chain: string[];
    depth: number;
    root: string;
    expanded: Set<string>;
    selected: string | null;
    onToggle: (key: string) => void;
    onSelect: (key: string) => void;
    onOpenFile: (absPath: string) => void;
    onContext: (ctx: NodeContext) => void;
};

export default function DataModelTreeNode({
    node,
    chain,
    depth,
    root,
    expanded,
    selected,
    onToggle,
    onSelect,
    onOpenFile,
    onContext,
}: Props) {
    const key = keyOf(chain);
    const isOpen = expanded.has(key);
    const isSelected = selected === key;
    const hasChildren = node.children.length > 0;
    const source = scriptPath(node);
    const { Icon, color } = iconForClass(node.className);
    const showClass = node.className !== node.name;

    const rowRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isSelected) rowRef.current?.scrollIntoView({ block: "nearest" });
    }, [isSelected]);

    const handleClick = async () => {
        onSelect(key);
        if (source) {
            onOpenFile(await join(root, ...source.split("/")));
        } else if (hasChildren) {
            onToggle(key);
        }
    };

    const handleChevron = (e: MouseEvent) => {
        e.stopPropagation();
        onToggle(key);
    };

    const handleContext = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSelect(key);
        onContext({ node, chain, x: e.clientX, y: e.clientY });
    };

    return (
        <div>
            <div
                ref={rowRef}
                className={`${styles.treeRow} ${isSelected ? styles.selected : ""}`}
                onClick={handleClick}
                onContextMenu={handleContext}
                title={node.className}
            >
                <span
                    className={styles.indent}
                    style={{ width: depth * 12 }}
                />

                {hasChildren ? (
                    <VscChevronRight
                        className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
                        onClick={handleChevron}
                    />
                ) : (
                    <span className={styles.chevronSpacer} />
                )}

                <Icon className={styles.icon} style={{ color }} />
                <span className={styles.nodeName}>{node.name}</span>
                {showClass && (
                    <span className={styles.className}>{node.className}</span>
                )}
            </div>

            {isOpen &&
                node.children.map((child, i) => (
                    <DataModelTreeNode
                        key={`${child.name} ${child.className} ${i}`}
                        node={child}
                        chain={[...chain, child.name]}
                        depth={depth + 1}
                        root={root}
                        expanded={expanded}
                        selected={selected}
                        onToggle={onToggle}
                        onSelect={onSelect}
                        onOpenFile={onOpenFile}
                        onContext={onContext}
                    />
                ))}
        </div>
    );
}
