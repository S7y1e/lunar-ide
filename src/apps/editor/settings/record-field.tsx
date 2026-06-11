import { useState } from "react";
import { VscClose } from "react-icons/vsc";
import styles from "./settings.module.scss";

type Props = {
    entries: Record<string, string>;
    onChange: (entries: Record<string, string>) => void;
};

type Pair = [string, string];

export default function RecordField({ entries, onChange }: Props) {
    const [rows, setRows] = useState<Pair[]>(() => Object.entries(entries));

    const commit = (next: Pair[]) => {
        setRows(next);
        const object: Record<string, string> = {};
        for (const [key, value] of next) {
            if (key) object[key] = value;
        }
        onChange(object);
    };

    const setKey = (index: number, key: string) =>
        commit(rows.map((row, i) => (i === index ? [key, row[1]] : row)));

    const setVal = (index: number, value: string) =>
        commit(rows.map((row, i) => (i === index ? [row[0], value] : row)));

    const remove = (index: number) =>
        commit(rows.filter((_, i) => i !== index));

    const add = () => commit([...rows, ["", ""]]);

    return (
        <div className={styles.list}>
            {rows.map((row, i) => (
                <div key={i} className={styles.listRow}>
                    <input
                        className={`${styles.input} ${styles.recordKey}`}
                        placeholder="key"
                        value={row[0]}
                        onChange={(e) => setKey(i, e.target.value)}
                    />
                    <input
                        className={`${styles.input} ${styles.recordValue}`}
                        placeholder="value"
                        value={row[1]}
                        onChange={(e) => setVal(i, e.target.value)}
                    />
                    <button
                        className={styles.removeBtn}
                        onClick={() => remove(i)}
                        aria-label="Remove"
                    >
                        <VscClose size={14} />
                    </button>
                </div>
            ))}
            <button className={styles.addBtn} onClick={add}>
                Add entry
            </button>
        </div>
    );
}
