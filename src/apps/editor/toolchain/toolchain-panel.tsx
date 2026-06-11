import { useMemo, useState } from "react";
import {
    VscRefresh,
    VscArrowUp,
    VscAdd,
    VscTrash,
    VscWarning,
} from "react-icons/vsc";
import styles from "./toolchain.module.scss";
import { RokitTool } from "./use-rokit";
import { AVAILABLE_TOOLS } from "./rokit-tools";
import { useOnlineStatus } from "./use-online-status";
import VersionPicker from "./version-picker";

type Props = {
    tools: RokitTool[];
    hasManifest: boolean;
    busy: boolean;
    logs: string[];
    onInstall: () => void;
    onUpdate: () => void;
    onInit: () => void;
    onAdd: (tool: string) => void;
    onRemove: (name: string) => void;
    onSetVersion: (name: string, version: string) => void;
};

export default function ToolchainPanel({
    tools,
    hasManifest,
    busy,
    logs,
    onInstall,
    onUpdate,
    onInit,
    onAdd,
    onRemove,
    onSetVersion,
}: Props) {
    const [newTool, setNewTool] = useState("");
    const offline = !useOnlineStatus();

    const suggestions = useMemo(() => {
        const q = newTool.trim().toLowerCase();
        if (!q) return [];
        const have = new Set(tools.map((t) => t.name.toLowerCase()));
        return AVAILABLE_TOOLS.filter(
            (tool) =>
                !have.has(tool.name.toLowerCase()) &&
                (tool.name.toLowerCase().includes(q) ||
                    tool.spec.toLowerCase().includes(q))
        ).slice(0, 6);
    }, [newTool, tools]);

    const add = (tool: string) => {
        const value = tool.trim();
        if (!value) return;
        onAdd(value);
        setNewTool("");
    };

    return (
        <div className={styles.toolchain}>
            <div className={styles.header}>
                <span className={styles.title}>Toolchain</span>
                {hasManifest && <span className={styles.count}>{tools.length}</span>}
            </div>

            {offline && (
                <div className={styles.offline}>
                    <VscWarning size={14} />
                    No internet — installing tools needs a connection.
                </div>
            )}

            {!hasManifest ? (
                <div className={styles.body}>
                    <p className={styles.hint}>No rokit.toml in this project.</p>
                    <button className={styles.action} onClick={onInit} disabled={busy}>
                        Initialize toolchain
                    </button>
                </div>
            ) : (
                <div className={styles.body}>
                    <div className={styles.tools}>
                        {tools.length === 0 ? (
                            <p className={styles.hint}>No tools declared.</p>
                        ) : (
                            tools.map((tool) => {
                                const at = tool.spec.lastIndexOf("@");
                                const repo =
                                    at < 0 ? tool.spec : tool.spec.slice(0, at);
                                const version =
                                    at < 0 ? "" : tool.spec.slice(at + 1);
                                return (
                                    <div key={tool.name} className={styles.tool}>
                                        <span
                                            className={styles.toolName}
                                            title={tool.spec}
                                        >
                                            {tool.name}
                                        </span>
                                        <VersionPicker
                                            repo={repo}
                                            current={version}
                                            disabled={busy || offline}
                                            onPick={(v) =>
                                                onSetVersion(tool.name, v)
                                            }
                                        />
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => onRemove(tool.name)}
                                            disabled={busy}
                                            aria-label={`Remove ${tool.name}`}
                                        >
                                            <VscTrash size={13} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className={styles.actions}>
                        <button
                            className={styles.action}
                            onClick={onInstall}
                            disabled={busy || offline}
                        >
                            <VscRefresh size={14} />
                            Install
                        </button>
                        <button
                            className={styles.action}
                            onClick={onUpdate}
                            disabled={busy || offline}
                        >
                            <VscArrowUp size={14} />
                            Update
                        </button>
                    </div>

                    <div className={styles.addField}>
                        <div className={styles.addRow}>
                            <input
                                className={styles.input}
                                value={newTool}
                                placeholder="search or owner/tool@version"
                                disabled={busy || offline}
                                onChange={(e) => setNewTool(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") add(newTool);
                                }}
                            />
                            <button
                                className={styles.addBtn}
                                onClick={() => add(newTool)}
                                disabled={busy || offline || !newTool.trim()}
                                aria-label="Add tool"
                            >
                                <VscAdd size={14} />
                            </button>
                        </div>
                        {suggestions.length > 0 && (
                            <div className={styles.suggestions}>
                                {suggestions.map((tool) => (
                                    <button
                                        key={tool.spec}
                                        className={styles.suggestion}
                                        disabled={busy || offline}
                                        title={tool.description}
                                        onClick={() => add(tool.spec)}
                                    >
                                        <span className={styles.suggestionName}>
                                            {tool.name}
                                        </span>
                                        <span className={styles.suggestionSpec}>
                                            {tool.spec}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.logs}>
                {logs.length === 0 ? (
                    <div className={styles.empty}>No output yet.</div>
                ) : (
                    logs.map((line, i) => (
                        <div key={i} className={styles.logLine}>
                            {line}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
