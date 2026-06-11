import { VscTerminal, VscChevronDown } from "react-icons/vsc";
import styles from "./terminal.module.scss";
import { useTerminal } from "./use-terminal";

type Props = {
    cwd: string;
    onClose: () => void;
};

export default function TerminalView({ cwd, onClose }: Props) {
    const ref = useTerminal(cwd);

    return (
        <div className={styles.panel}>
            <div className={styles.header}>
                <span className={styles.title}>
                    <VscTerminal size={13} />
                    Terminal
                </span>
                <button
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Close terminal"
                >
                    <VscChevronDown size={16} />
                </button>
            </div>
            <div className={styles.terminal} ref={ref} />
        </div>
    );
}
