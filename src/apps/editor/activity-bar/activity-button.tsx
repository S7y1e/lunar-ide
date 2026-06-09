import styles from "./activity-bar.module.scss"
import {IconType} from "react-icons";

type Props = {
    icon: IconType;
    label: string;
    active: boolean;
    onClick: () => void;
};

export default function ActivityButton({ label, icon: Icon, active, onClick }: Props) {
    return (
        <button
            className={`${styles.activityButton} ${active ? styles.active : ""}`}
            onClick={onClick}
            aria-label={label}
        >
            <Icon size={20} />
        </button>
    );
}