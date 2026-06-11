import { useRef } from "react";
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

type Props = {
    path: string | null;
    onDirtyChange: (path: string, dirty: boolean) => void;
};

export default function EditorPane({ path, onDirtyChange }: Props) {
    const { content, setContent, save } = useFileContent(path);
    const autocompleteEndEnabled = useRef(false);
    const onDirtyRef = useRef(onDirtyChange);
    onDirtyRef.current = onDirtyChange;

    // Tracks whether we've already reported dirty=true for the current path
    const reportedDirtyRef = useRef(false);
    // Reset when path changes
    const prevPathRef = useRef(path);
    if (path !== prevPathRef.current) {
        prevPathRef.current = path;
        reportedDirtyRef.current = false;
    }

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
                if (!path) return;
                save().then(() => {
                    reportedDirtyRef.current = false;
                    onDirtyRef.current(path, false);
                });
            },
        });
    }

    function handleChange(value: string) {
        if (!path) return;
        setContent(value);
        if (!reportedDirtyRef.current) {
            reportedDirtyRef.current = true;
            onDirtyRef.current(path, true);
        }
    }

    if (!path) {
        return <div className={styles.empty}>Open a file to start editing</div>;
    }

    const name = path.split(/[\\/]/).pop() ?? path;

    return (
        <MonacoEditor
            path={pathToUri(path)}
            value={content}
            language={languageFor(name)}
            theme="lunar-darcula"
            onChange={(value) => handleChange(value ?? "")}
            options={EDITOR_OPTIONS}
            onMount={handleMount}
        />
    );
}
