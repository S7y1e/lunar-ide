import { useEffect, useState } from "react";
import { Editor as MonacoEditor } from "@monaco-editor/react";
import "./monaco-setup";
import styles from "./code-editor.module.scss";
import { readFileText } from "../../../lib/filesystem";
import "@fontsource/jetbrains-mono/index.css"

const languageFor = (name: string): string => {
    const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
    switch (ext) {
        case "luau":
        case "lua":
            return "lua";
        case "ts":
        case "tsx":
            return "typescript";
        case "js":
        case "jsx":
            return "javascript";
        case "json":
        case "jsonc":
            return "json";
        case "md":
        case "markdown":
            return "markdown";
        case "css":
        case "scss":
            return "scss";
        case "html":
            return "html";
        case "yml":
        case "yaml":
            return "yaml";
        default:
            return "plaintext";
    }
};

type Props = {
    path: string | null;
};

export default function EditorPane({ path }: Props) {
    const [content, setContent] = useState("");

    useEffect(() => {
        if (!path) return;
        let alive = true;
        readFileText(path)
            .then((c) => alive && setContent(c))
            .catch(() => alive && setContent(""));
        return () => {
            alive = false;
        };
    }, [path]);

    if (!path) {
        return <div className={styles.empty}>Open a file to start editing</div>;
    }

    const name = path.split(/[\\/]/).pop() ?? path;

    return (
        <MonacoEditor
            path={path}
            value={content}
            language={languageFor(name)}
            theme="lunar-darcula"
            onChange={(value) => setContent(value ?? "")}
            options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                fontLigatures: true,
                lineHeight: 20,
                letterSpacing: 0,
                smoothScrolling: true,
                lineNumbersMinChars: 4,
                lineDecorationsWidth: 25,
                glyphMargin: false,
                scrollBeyondLastLine: false,
                padding: { top: 6 },
                scrollbar: {
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                    useShadows: false,
                },
                guides: {
                    indentation: true,
                    highlightActiveIndentation: true,
                    bracketPairs: false,
                },
                rulers: [0],
            }}
        />
    );
}
