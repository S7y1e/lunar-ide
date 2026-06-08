import styles from "./style.module.scss";
import ActivityButton from "./activity-button";
import { useState } from "react";
import {
    ACTIVITY_VIEWS,
    DEFAULT_ACTIVITY_VIEW,
    ActivityViewId,
} from "./activity-views";
import {readDirectory} from "../../lib/filesystem";

type Props = {
    onChange: (id: ActivityViewId | null) => void;
};

export default function ActivityBar({ onChange }: Props) {
    const [active, setActive] = useState<ActivityViewId | null>(
        DEFAULT_ACTIVITY_VIEW
    );

    const handleClick = (id: ActivityViewId) => {
        setActive((current) => {
            const next = current === id ? null : id;
            onChange(next);
            return next;
        });
    };

    return (
        <div className={styles.activityBar}>
            {ACTIVITY_VIEWS.map((view) => (
                <ActivityButton
                    key={view.id}
                    icon={view.icon}
                    label={view.label}
                    active={active === view.id}
                    onClick={() => handleClick(view.id)}
                />
            ))}
        </div>
    );
}
