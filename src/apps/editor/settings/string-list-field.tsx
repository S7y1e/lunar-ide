import { VscClose } from "react-icons/vsc";
import styles from "./settings.module.scss";

type Props = {
    values: string[];
    onChange: (values: string[]) => void;
};

export default function StringListField({ values, onChange }: Props) {
    const update = (index: number, value: string) =>
        onChange(values.map((v, i) => (i === index ? value : v)));

    const remove = (index: number) =>
        onChange(values.filter((_, i) => i !== index));

    const add = () => onChange([...values, ""]);

    return (
        <div className={styles.list}>
            {values.map((value, i) => (
                <div key={i} className={styles.listRow}>
                    <input
                        className={styles.input}
                        value={value}
                        onChange={(e) => update(i, e.target.value)}
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
                Add item
            </button>
        </div>
    );
}
