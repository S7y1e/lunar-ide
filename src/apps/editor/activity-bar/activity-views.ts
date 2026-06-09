import { IconType } from "react-icons";
import { FaRegFolder } from "react-icons/fa";

export type ActivityViewId = "project";

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
];

export const DEFAULT_ACTIVITY_VIEW: ActivityViewId = "project";
