import { VscSettingsGear, VscTerminal } from "react-icons/vsc";
import styles from "./activity-bar.module.scss";
import ActivityButton from "./activity-button";
import { ACTIVITY_VIEWS, ActivityViewId } from "./activity-views";

type Props = {
    active: ActivityViewId | null;
    onSelect: (id: ActivityViewId) => void;
    terminalOpen: boolean;
    onToggleTerminal: () => void;
    onOpenSettings: () => void;
};

export default function ActivityBar({
    active,
    onSelect,
    terminalOpen,
    onToggleTerminal,
    onOpenSettings,
}: Props) {
    return (
        <div className={styles.activityBar}>
            {ACTIVITY_VIEWS.map((view) => (
                <ActivityButton
                    key={view.id}
                    icon={view.icon}
                    label={view.label}
                    active={active === view.id}
                    onClick={() => onSelect(view.id)}
                />
            ))}

            <div className={styles.spacer} />

            <ActivityButton
                icon={VscTerminal}
                label="Terminal"
                active={terminalOpen}
                onClick={onToggleTerminal}
            />

            <ActivityButton
                icon={VscSettingsGear}
                label="Settings"
                active={false}
                onClick={onOpenSettings}
            />
        </div>
    );
}
