import styles from "./style.module.scss";
import SidebarButton from "./sidebar-button";
import { FaRegFolder } from "react-icons/fa";

export default function Sidebar() {
    return (
        <div className={styles.activityBar}>
            <SidebarButton
                icon={FaRegFolder}
                label="Project"
                active={false}
                onClick={() => {}}
            />
        </div>
    );
}