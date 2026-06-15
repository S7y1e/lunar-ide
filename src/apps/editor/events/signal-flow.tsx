import { VscArrowRight, VscRadioTower } from "react-icons/vsc";
import { type Signal } from "../../../lib/project";
import styles from "./events.module.scss";

const baseName = (rel: string) => rel.split("/").pop() ?? rel;

function kindColor(kind: string): string {
    switch (kind) {
        case "RemoteEvent":
        case "UnreliableRemoteEvent":
            return "var(--accent)";
        case "RemoteFunction":
            return "var(--brand)";
        case "BindableEvent":
        case "BindableFunction":
            return "var(--warning)";
        case "module":
            return "var(--muted)";
        default:
            return "var(--icon)";
    }
}

type Props = {
    signal: Signal;
    onOpen: (rel: string) => void;
};

export default function SignalFlow({ signal, onOpen }: Props) {
    const color = kindColor(signal.kind);

    const fileBox = (rel: string, key: string) => (
        <button
            key={key}
            className={styles.fileBox}
            onClick={() => onOpen(rel)}
            title={rel}
        >
            {baseName(rel)}
        </button>
    );

    return (
        <div className={styles.flow}>
            <div className={styles.firers}>
                {signal.firedBy.length === 0 ? (
                    <span className={styles.none}>no fire sites</span>
                ) : (
                    signal.firedBy.map((f, i) => fileBox(f, `f${i}`))
                )}
            </div>

            <VscArrowRight className={styles.arrow} />

            <div
                className={styles.signalNode}
                style={{ color, borderColor: color }}
            >
                <VscRadioTower size={13} />
                <span className={styles.signalLabel} title={signal.label}>
                    {signal.label}
                </span>
                <span className={styles.signalKind}>{signal.kind}</span>
            </div>

            <VscArrowRight className={styles.arrow} />

            <div className={styles.listeners}>
                {signal.connectedBy.length === 0 ? (
                    <span className={styles.none}>no listeners</span>
                ) : (
                    signal.connectedBy.map((f, i) => fileBox(f, `c${i}`))
                )}
            </div>
        </div>
    );
}
