import { useEffect, useRef, useState } from "react";
import { VscChevronDown, VscCollapseAll } from "react-icons/vsc";
import { join } from "@tauri-apps/api/path";
import { useDataModel } from "./use-data-model";
import DataModelTreeNode, { type NodeContext } from "./data-model-tree-node";
import ContextMenu, { type MenuItem } from "../file-tree/context-menu";
import {
    keyOf,
    scriptPath,
    instancePath,
    requireSnippet,
    toRelative,
    findInstanceChain,
    defaultExpanded,
} from "./instance-path";
import styles from "./data-model.module.scss";

type Props = {
    root: string;
    activeFile: string | null;
    onOpenFile: (absPath: string) => void;
};

const copy = (text: string) =>
    navigator.clipboard?.writeText(text).catch((e) =>
        console.warn("[datamodel] clipboard write failed", e),
    );

export default function DataModelPanel({ root, activeFile, onOpenFile }: Props) {
    const { tree, loading } = useDataModel(root);

    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [selected, setSelected] = useState<string | null>(null);
    const [menu, setMenu] = useState<NodeContext | null>(null);

    const seeded = useRef(false);
    useEffect(() => {
        seeded.current = false;
        setSelected(null);
    }, [root]);
    useEffect(() => {
        if (tree && !seeded.current) {
            seeded.current = true;
            setExpanded(defaultExpanded(tree));
        }
    }, [tree]);

    useEffect(() => {
        if (!tree || !activeFile) return;
        const chain = findInstanceChain(tree, toRelative(root, activeFile));
        if (!chain) return;
        setExpanded((prev) => {
            const next = new Set(prev);
            for (let i = 1; i <= chain.length; i++) next.add(keyOf(chain.slice(0, i)));
            return next;
        });
        setSelected(keyOf(chain));
    }, [activeFile, tree, root]);

    const toggle = (key: string) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const menuItems = (ctx: NodeContext): MenuItem[] => {
        const rootIsGame = tree?.className === "DataModel";
        const items: MenuItem[] = [];
        const source = scriptPath(ctx.node);
        if (source) {
            items.push({
                label: "Open File",
                onClick: async () =>
                    onOpenFile(await join(root, ...source.split("/"))),
            });
        }
        items.push({
            label: "Copy Instance Path",
            onClick: () => copy(instancePath(ctx.chain, rootIsGame)),
        });
        if (ctx.node.className === "ModuleScript") {
            items.push({
                label: "Copy require()",
                onClick: () => copy(requireSnippet(ctx.chain, rootIsGame)),
            });
        }
        return items;
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <span className={styles.title}>
                    <VscChevronDown size={14} />
                    DataModel
                </span>
                <button
                    className={styles.headerBtn}
                    onClick={() => setExpanded(new Set())}
                    title="Collapse All"
                    aria-label="Collapse All"
                >
                    <VscCollapseAll size={16} />
                </button>
            </div>

            <div className={styles.tree}>
                {tree ? (
                    <DataModelTreeNode
                        node={tree}
                        chain={[tree.name]}
                        depth={0}
                        root={root}
                        expanded={expanded}
                        selected={selected}
                        onToggle={toggle}
                        onSelect={setSelected}
                        onOpenFile={onOpenFile}
                        onContext={setMenu}
                    />
                ) : (
                    <div className={styles.empty}>
                        {loading
                            ? "Loading…"
                            : "No sourcemap yet — open a Rojo/Argon project to see its DataModel."}
                    </div>
                )}
            </div>

            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    items={menuItems(menu)}
                    onClose={() => setMenu(null)}
                />
            )}
        </div>
    );
}
