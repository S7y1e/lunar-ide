import { IconType } from "react-icons";
import { FaRegFolder } from "react-icons/fa";
import { IoSyncOutline } from "react-icons/io5";
import { VscTools, VscListTree } from "react-icons/vsc";

export type ActivityViewId = "project" | "datamodel" | "sync" | "toolchain";

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
        id: "datamodel",
        label: "DataModel",
        icon: VscListTree,
    },
    {
        id: "sync",
        label: "Sync",
        icon: IoSyncOutline,
    },
    {
        id: "toolchain",
        label: "Toolchain",
        icon: VscTools,
    },
];

export const DEFAULT_ACTIVITY_VIEW: ActivityViewId = "project";