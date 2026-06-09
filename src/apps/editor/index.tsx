import {useEffect, useState} from "react";
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import styles from "./style.module.scss";
import ActivityBar from "./activity-bar";
import Sidebar from "./sidebar";
import { ActivityViewId, DEFAULT_ACTIVITY_VIEW } from "./activity-views";


type Props = {
    path: string;
};

export default function Editor({ path }: Props) {
    const [currentWindow, setCurrentWindow] = useState<ActivityViewId | null>(
        DEFAULT_ACTIVITY_VIEW
    );
    const sidebarRef = usePanelRef();

    useEffect(() => {
        const panel = sidebarRef.current;
        if (!panel) return;
        if (currentWindow) panel.expand();
        else panel.collapse();
    }, [currentWindow]);

    return (
        <div className={styles.editor}>
            <ActivityBar onChange={setCurrentWindow} />

            <Group
                orientation="horizontal"
                className={styles.panels}
                resizeTargetMinimumSize={{ coarse: 20, fine: 12 }}
            >
                <Panel
                    panelRef={sidebarRef}
                    collapsible
                    collapsedSize={0}
                    defaultSize={28}
                    minSize={12}
                >
                    <Sidebar currentWindow={currentWindow} path={path} />
                </Panel>

                {currentWindow && <Separator className={styles.handle} />}

                <Panel className={styles.main}>
                </Panel>
            </Group>
        </div>
    );
}