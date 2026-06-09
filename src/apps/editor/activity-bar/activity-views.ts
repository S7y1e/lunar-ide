import { IconType } from "react-icons";
import { FaRegFolder } from "react-icons/fa";
import { IoSyncOutline } from "react-icons/io5";

export type ActivityViewId = "project" | "sync";

export type ActivityView = {
    id: ActivityViewId;
    label: string;
    icon: IconType;
};

export const ACTIVITY_VIEWS: ActivityView[] = [
    {
        id: "project",
        label: "Project",
        icon: FaRegFolder,
    },
    {
        id: "sync",
        label: "Sync",
        icon: IoSyncOutline,
    },
];

export const DEFAULT_ACTIVITY_VIEW: ActivityViewId = "project";