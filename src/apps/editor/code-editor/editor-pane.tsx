import { useEffect, useRef, useState } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import "./monaco-setup";
import "@fontsource/jetbrains-mono/index.css";
import styles from "./code-editor.module.scss";
import { languageFor } from "./editor-language";
import { EDITOR_OPTIONS } from "./editor-options";
import { useFileContent } from "./use-file-content";
import { pathToUri } from "./luau-lsp/uri";
import { registerAutocompleteEnd } from "./luau-lsp/autocomplete-end";
import { readSettings } from "../../../lib/settings";
import { MONACO_THEME, getTheme, subscribeTheme } from "../../../lib/theme";

type Props = {
    path: string | null;
    onDirtyChange: (path: string, dirty: boolean) => void;
};

export default function EditorPane({ path, onDirtyChange }: Props) {
    const {
        content,
        setContent,
        save,
        saveError,
        isDirty,
        externalChange,
        reloadFromDisk,
        keepMine,
    } = useFileContent(path);
    const [theme, setTheme] = useState(getTheme());
    useEffect(() => subscribeTheme(setTheme), []);
    const autocompleteEndEnabled = useRef(false);
    const onDirtyRef = useRef(onDirtyChange);
    onDirtyRef.current = onDirtyChange;

    // Single source of truth for the dirty indicator: buffer vs. what's on disk.
    // This also self-corrects when the file is reloaded after an external
    // (Argon) write, since isDirty goes back to false.
    useEffect(() => {
        if (path) onDirtyRef.current(path, isDirty);
    }, [path, isDirty]);

    function handleMount(editor: monaco.editor.IStandaloneCodeEditor) {
        readSettings().then((values) => {
            autocompleteEndEnabled.current =
                values["luau-lsp.completion.autocompleteEnd"] === true;
        });

        registerAutocompleteEnd(editor, () => autocompleteEndEnabled.current);

        editor.addAction({
            id: "lunar.saveFile",
            label: "Save File",
            keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
            run: () => {
                save().catch((e) => console.error("save failed", e));
            },
        });
    }

    function handleChange(value: string) {
        if (!path) return;
        setContent(value);
    }

    if (!path) {
        return <div className={styles.empty}>Open a file to start editing</div>;
    }

    const name = path.split(/[\\/]/).pop() ?? path;

    return (
        <div className={styles.paneRoot}>
            {saveError && (
                <div className={styles.saveErrorBanner}>
                    Save failed: {saveError}
                </div>
            )}
            {externalChange && (
                <div className={styles.conflictBanner}>
                    <span className={styles.conflictText}>
                        This file changed on disk
                        {isDirty ? " (you have unsaved edits)" : ""}.
                    </span>
                    <div className={styles.conflictActions}>
                        <button
                            className={styles.conflictReload}
                            onClick={reloadFromDisk}
                        >
                            Reload
                        </button>
                        <button
                            className={styles.conflictKeep}
                            onClick={keepMine}
                        >
                            Keep mine
                        </button>
                    </div>
                </div>
            )}
            <div className={styles.paneEditor}>
                <MonacoEditor
                    path={pathToUri(path)}
                    value={content}
                    language={languageFor(name)}
                    theme={MONACO_THEME[theme]}
                    onChange={(value) => handleChange(value ?? "")}
                    options={EDITOR_OPTIONS}
                    onMount={handleMount}
                />
            </div>
        </div>
    );
}
