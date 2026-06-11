import { useEffect } from "react";
import { usePanelRef } from "react-resizable-panels";
import { ActivityViewId } from "../activity-bar/activity-views";

export function useSidebarPanel(currentView: ActivityViewId | null) {
    const panelRef = usePanelRef();

    useEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        if (currentView) panel.expand();
        else panel.collapse();
    }, [currentView]);

    return panelRef;
}
