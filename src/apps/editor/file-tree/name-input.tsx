import { useState } from "react";
import styles from "./file-tree.module.scss";

type Props = {
    initial: string;
    onSubmit: (value: string) => void;
    onCancel: () => void;
};

export default function NameInput({ initial, onSubmit, onCancel }: Props) {
    const [value, setValue] = useState(initial);

    return (
        <input
            className={styles.nodeInput}
            value={value}
            autoFocus
            spellCheck={false}
            onChange={(e) => setValue(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit(value);
                else if (e.key === "Escape") onCancel();
            }}
            onBlur={onCancel}
        />
    );
}
