import {useEffect, useState} from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import styles from "./style.module.scss";
import ActivityBar from "./activity-bar";
import Sidebar from "./sidebar";
import { ActivityViewId } from "./activity-views";


type Props = {
    path: string;
};

export default function Editor({ path }: Props) {
    const [currentWindow, setCurrentWindow] = useState<ActivityViewId | null>(null);

    return (
        <div className={styles.editor}>
            <ActivityBar onChange={setCurrentWindow} />

            <Group orientation="horizontal" className={styles.panels}>
                <Panel defaultSize={20} minSize={12}>
                    <Sidebar currentWindow={currentWindow} path={path} />
                </Panel>

                <Separator className={styles.handle} />

                <Panel defaultSize={80} className={styles.main}>
                </Panel>
            </Group>
        </div>
    );
}