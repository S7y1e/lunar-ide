import { VscChevronDown, VscRefresh, VscArrowRight, VscArrowLeft } from "react-icons/vsc";
import { join } from "@tauri-apps/api/path";
import { useDependencies } from "./use-dependencies";
import { toRelative } from "../data-model/instance-path";
import styles from "./dependencies.module.scss";

type Props = {
    root: string;
    activeFile: string | null;
    onOpenFile: (absPath: string) => void;
};

const baseName = (rel: string) => rel.split("/").pop() ?? rel;

/**
 * Dependency view for the active module: what it requires and what requires it,
 * both clickable, plus any requires the resolver couldn't pin down. A query on
 * the dependency graph the model owns — the seed of event topography.
 */
export default function DependenciesPanel({ root, activeFile, onOpenFile }: Props) {
    const { graph, loading, refresh } = useDependencies(root);
    const rel = activeFile ? toRelative(root, activeFile) : null;

    const requires = graph && rel ? graph.edges.filter((e) => e.from === rel) : [];
    const requiredBy = graph && rel ? graph.edges.filter((e) => e.to === rel) : [];
    const unresolved =
        graph && rel ? graph.unresolved.filter((u) => u.from === rel) : [];

    const open = async (relFile: string) =>
        onOpenFile(await join(root, ...relFile.split("/")));

    const row = (relFile: string) => (
        <button
            key={relFile}
            className={styles.row}
            onClick={() => open(relFile)}
            title={relFile}
        >
            <span className={styles.name}>{baseName(relFile)}</span>
            <span className={styles.path}>{relFile}</span>
        </button>
    );

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <span className={styles.title}>
                    <VscChevronDown size={14} />
                    Dependencies
                </span>
                <button
                    className={styles.headerBtn}
                    onClick={refresh}
                    title="Refresh"
                    aria-label="Refresh"
                >
                    <VscRefresh size={16} />
                </button>
            </div>

            <div className={styles.body}>
                {!rel ? (
                    <div className={styles.empty}>
                        {loading
                            ? "Loading…"
                            : "Open a module to see what it requires and what requires it."}
                    </div>
                ) : (
                    <>
                        <div className={styles.module} title={rel}>
                            {baseName(rel)}
                        </div>

                        <div className={styles.section}>
                            <VscArrowRight size={12} /> Requires ({requires.length})
                        </div>
                        {requires.map((e) => row(e.to))}

                        <div className={styles.section}>
                            <VscArrowLeft size={12} /> Required by ({requiredBy.length})
                        </div>
                        {requiredBy.map((e) => row(e.from))}

                        {unresolved.length > 0 && (
                            <>
                                <div className={styles.section}>
                                    Unresolved ({unresolved.length})
                                </div>
                                {unresolved.map((u, i) => (
                                    <div
                                        key={`${u.expr}-${i}`}
                                        className={styles.unresolved}
                                        title="Couldn't resolve this require statically"
                                    >
                                        {u.expr}
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
