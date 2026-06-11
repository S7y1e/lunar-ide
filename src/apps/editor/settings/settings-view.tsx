import { useEffect, useMemo, useState } from "react";
import { VscClose } from "react-icons/vsc";
import styles from "./settings.module.scss";
import { ALL_SETTINGS, settingsNav } from "./registry";
import { Setting } from "./setting";
import { useSettings } from "./use-settings";
import SettingsField from "./settings-field";

type Props = {
    onClose: () => void;
};

type Section = {
    id: string;
    tool: string;
    category: string;
    settings: Setting[];
};

const matchesQuery = (setting: Setting, q: string): boolean =>
    setting.key.toLowerCase().includes(q) ||
    setting.label.toLowerCase().includes(q) ||
    setting.description.toLowerCase().includes(q);

function sectionsOf(settings: Setting[]): Section[] {
    const sections: Section[] = [];
    for (const setting of settings) {
        const id = `${setting.tool}::${setting.category}`;
        let section = sections.find((s) => s.id === id);
        if (!section) {
            section = {
                id,
                tool: setting.tool,
                category: setting.category,
                settings: [],
            };
            sections.push(section);
        }
        section.settings.push(setting);
    }
    return sections;
}

export default function SettingsView({ onClose }: Props) {
    const { values, setValue, resetValue } = useSettings();
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<string | null>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const nav = useMemo(settingsNav, []);

    const sections = useMemo(() => {
        const q = query.trim().toLowerCase();
        const visible = ALL_SETTINGS.filter((setting) => {
            if (selected && `${setting.tool}::${setting.category}` !== selected) {
                return false;
            }
            return !q || matchesQuery(setting, q);
        });
        return sectionsOf(visible);
    }, [query, selected]);

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
                            selected === null ? styles.navItemActive : ""
                        }`}
                        onClick={() => setSelected(null)}
                    >
                        All settings
                    </button>
                    {nav.map((tool) => (
                        <div key={tool.name} className={styles.navTool}>
                            <span className={styles.navToolName}>{tool.name}</span>
                            {tool.categories.map((category) => {
                                const id = `${tool.name}::${category}`;
                                return (
                                    <button
                                        key={id}
                                        className={`${styles.navItem} ${
                                            selected === id ? styles.navItemActive : ""
                                        }`}
                                        onClick={() => setSelected(id)}
                                    >
                                        {category}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                <div className={styles.fields}>
                    {sections.length === 0 ? (
                        <div className={styles.empty}>No settings match your search.</div>
                    ) : (
                        sections.map((section) => (
                            <section key={section.id} className={styles.section}>
                                <h3 className={styles.sectionHead}>
                                    <span className={styles.sectionTool}>
                                        {section.tool}
                                    </span>
                                    {section.category}
                                </h3>
                                {section.settings.map((setting) => (
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
                                ))}
                            </section>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
