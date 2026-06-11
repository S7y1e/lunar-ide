import { Editor as MonacoEditor } from "@monaco-editor/react";
import "./monaco-setup";
import "@fontsource/jetbrains-mono/index.css";
import styles from "./code-editor.module.scss";
import { languageFor } from "./editor-language";
import { EDITOR_OPTIONS } from "./editor-options";
import { useFileContent } from "./use-file-content";
import { pathToUri } from "./luau-lsp/uri";

type Props = {
    path: string | null;
};

export default function EditorPane({ path }: Props) {
    const [content, setContent] = useFileContent(path);

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
            onChange={(value) => setContent(value ?? "")}
            options={EDITOR_OPTIONS}
        />
    );
}
