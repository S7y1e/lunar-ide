import { VscChevronDown, VscRefresh } from "react-icons/vsc";
import { join } from "@tauri-apps/api/path";
import { useEvents } from "./use-events";
import SignalFlow from "./signal-flow";
import styles from "./events.module.scss";

const baseName = (rel: string) => rel.split("/").pop() ?? rel;

type Props = {
    root: string;
    onOpenFile: (absPath: string) => void;
};

export default function EventsPanel({ root, onOpenFile }: Props) {
    const { graph, loading, refresh } = useEvents(root);
    const open = async (rel: string) =>
        onOpenFile(await join(root, ...rel.split("/")));

    const signals = graph?.signals ?? [];
    const unresolved = graph?.unresolved ?? [];

    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <span className={styles.title}>
                    <VscChevronDown size={14} />
                    Events
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
                {signals.length === 0 ? (
                    <div className={styles.empty}>
                        {loading
                            ? "Loading…"
                            : "No signals found yet — fire or connect a Remote/Bindable (or a required module signal) to see the topography."}
                    </div>
                ) : (
                    signals.map((s) => (
                        <SignalFlow key={s.id} signal={s} onOpen={open} />
                    ))
                )}

                {unresolved.length > 0 && (
                    <>
                        <div className={styles.section}>
                            Unresolved ({unresolved.length})
                        </div>
                        {unresolved.map((u, i) => (
                            <button
                                key={`${u.expr}-${i}`}
                                className={styles.unresolved}
                                onClick={() => open(u.from)}
                                title={`${u.action} in ${u.from}`}
                            >
                                <span className={styles.unresolvedArrow}>
                                    {u.action === "fire" ? "▲" : "▼"}
                                </span>
                                {u.expr}
                                <span className={styles.unresolvedFrom}>
                                    {baseName(u.from)}
                                </span>
                            </button>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
