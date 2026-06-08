import { useState } from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import styles from "./style.module.scss";
import Sidebar from "./sidebar";

type Props = {
    path: string;
};

export default function Editor({ path }: Props) {
    const [explorer, setExplorer] = useState<boolean>(true);

    return (
        <div className={styles.editor}>
            <Sidebar></Sidebar>
        </div>
    )
}