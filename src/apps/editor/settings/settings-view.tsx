import { useEffect, useMemo, useState } from "react";
import { VscClose } from "react-icons/vsc";
import styles from "./settings.module.scss";
import {
    LUAU_SETTINGS,
    LuauSetting,
    categoryOf,
    settingCategories,
} from "./luau-lsp-config";
import { useSettings } from "./use-settings";
import SettingsField from "./settings-field";

type Props = {
    onClose: () => void;
};

const matches = (setting: LuauSetting, query: string): boolean => {
    const q = query.toLowerCase();
    return (
        setting.key.toLowerCase().includes(q) ||
        setting.description.toLowerCase().includes(q)
    );
};

export default function SettingsView({ onClose }: Props) {
    const { values, setValue, resetValue } = useSettings();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const categories = useMemo(settingCategories, []);

    const visible = useMemo(
        () =>
            LUAU_SETTINGS.filter(
                (s) =>
                    (!category || categoryOf(s.key) === category) &&
                    (!query || matches(s, query))
            ),
        [category, query]
    );

    return (
        <div className={styles.settingsOverlay}>
            <div className={styles.header}>
                <span className={styles.title}>Settings</span>
                <input
                    className={styles.search}
                    value={query}
                    autoFocus
                    spellCheck={false}
                    placeholder="Search settings"
                    onChange={(e) => setQuery(e.target.value)}
                />
                <button
                    className={styles.closeBtn}
                    onClick={onClose}
                    aria-label="Close settings"
                >
                    <VscClose size={18} />
                </button>
            </div>

            <div className={styles.body}>
                <nav className={styles.nav}>
                    <button
                        className={`${styles.navItem} ${
                            category === null ? styles.navItemActive : ""
                        }`}
                        onClick={() => setCategory(null)}
                    >
                        All
                    </button>
                    {categories.map((name) => (
                        <button
                            key={name}
                            className={`${styles.navItem} ${
                                category === name ? styles.navItemActive : ""
                            }`}
                            onClick={() => setCategory(name)}
                        >
                            {name}
                        </button>
                    ))}
                </nav>

                <div className={styles.fields}>
                    {visible.length === 0 ? (
                        <div className={styles.empty}>No settings match your search.</div>
                    ) : (
                        visible.map((setting) => (
                            <SettingsField
                                key={setting.key}
                                setting={setting}
                                value={
                                    setting.key in values
                                        ? values[setting.key]
                                        : setting.default
                                }
                                modified={setting.key in values}
                                onChange={(v) => setValue(setting.key, v)}
                                onReset={() => resetValue(setting.key)}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
