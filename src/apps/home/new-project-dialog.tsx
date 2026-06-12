import { useState } from "react";
import styles from "./new-project.module.scss";
import { FolderTemplate, NewProjectOptions } from "../../lib/projects";

type Props = {
    onCreate: (options: NewProjectOptions) => void;
    onCancel: () => void;
};

type TemplateOption = {
    id: FolderTemplate;
    label: string;
    description: string;
};

const TEMPLATES: TemplateOption[] = [
    {
        id: "game",
        label: "Game",
        description: "Shared, Server, and Client",
    },
    {
        id: "place",
        label: "Place",
        description: "A folder for every service",
    },
    {
        id: "plugin",
        label: "Plugin",
        description: "A buildable plugin source",
    },
];

type ToolKey = "wally" | "stylua" | "selene";

const TOOLS: { id: ToolKey; label: string; description: string }[] = [
    { id: "wally", label: "Wally", description: "Package manager" },
    { id: "stylua", label: "StyLua", description: "Code formatter" },
    { id: "selene", label: "Selene", description: "Linter" },
];

export default function NewProjectDialog({ onCreate, onCancel }: Props) {
    const [name, setName] = useState("");
    const [template, setTemplate] = useState<FolderTemplate>("game");
    const [tools, setTools] = useState<Record<ToolKey, boolean>>({
        wally: true,
        stylua: true,
        selene: false,
    });

    const trimmed = name.trim();
    const valid = trimmed.length > 0;

    const submit = () => {
        if (!valid) return;
        onCreate({
            name: trimmed,
            template,
            wally: tools.wally,
            stylua: tools.stylua,
            selene: tools.selene,
        });
    };

    const toggle = (key: ToolKey) =>
        setTools((prev) => ({ ...prev, [key]: !prev[key] }));

    return (
        <div className={styles.overlay} onClick={onCancel}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.heading}>Create New Game</h2>

                <label className={styles.label}>Project name</label>
                <input
                    className={styles.input}
                    value={name}
                    autoFocus
                    spellCheck={false}
                    placeholder="my-awesome-game"
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") submit();
                        else if (e.key === "Escape") onCancel();
                    }}
                />

                <label className={styles.label}>Folder structure</label>
                <div className={styles.options}>
                    {TEMPLATES.map((t) => (
                        <button
                            key={t.id}
                            className={
                                template === t.id
                                    ? `${styles.option} ${styles.optionActive}`
                                    : styles.option
                            }
                            onClick={() => setTemplate(t.id)}
                        >
                            <span className={styles.optionTitle}>{t.label}</span>
                            <span className={styles.optionDesc}>
                                {t.description}
                            </span>
                        </button>
                    ))}
                </div>

                <label className={styles.label}>Tooling</label>
                <div className={styles.tools}>
                    {TOOLS.map((tool) => (
                        <button
                            key={tool.id}
                            className={
                                tools[tool.id]
                                    ? `${styles.tool} ${styles.toolActive}`
                                    : styles.tool
                            }
                            onClick={() => toggle(tool.id)}
                        >
                            <span className={styles.checkbox}>
                                {tools[tool.id] ? "✓" : ""}
                            </span>
                            <span className={styles.toolInfo}>
                                <span className={styles.optionTitle}>
                                    {tool.label}
                                </span>
                                <span className={styles.optionDesc}>
                                    {tool.description}
                                </span>
                            </span>
                        </button>
                    ))}
                </div>
                <p className={styles.hint}>
                    Tools are added to a rokit.toml manifest — run{" "}
                    <code>rokit install</code> in the project to fetch them.
                </p>

                <div className={styles.actions}>
                    <button className={styles.cancel} onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        className={styles.create}
                        disabled={!valid}
                        onClick={submit}
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
}
