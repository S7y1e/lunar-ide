import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import { registerLuauLanguage } from "./luau-language";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

self.MonacoEnvironment = {
    getWorker(_moduleId, label) {
        switch (label) {
            case "json":
                return new jsonWorker();
            case "css":
            case "scss":
            case "less":
                return new cssWorker();
            case "html":
            case "handlebars":
            case "razor":
                return new htmlWorker();
            case "typescript":
            case "javascript":
                return new tsWorker();
            default:
                return new editorWorker();
        }
    },
};

loader.config({ monaco });

registerLuauLanguage();

monaco.editor.defineTheme("lunar-darcula", {
    base: "vs-dark",
    inherit: true,
    rules: [
        { token: "", foreground: "a9b7c6" },
        { token: "comment", foreground: "808080", fontStyle: "italic" },
        { token: "keyword", foreground: "cc7832" },
        { token: "keyword.control", foreground: "cc7832" },
        { token: "string", foreground: "6a8759" },
        { token: "string.escape", foreground: "cc7832" },
        { token: "number", foreground: "6897bb" },
        { token: "constant", foreground: "9876aa" },
        { token: "constant.language", foreground: "cc7832" },
        { token: "type", foreground: "a9b7c6" },
        { token: "type.identifier", foreground: "a9b7c6" },
        { token: "function", foreground: "ffc66d" },
        { token: "identifier", foreground: "a9b7c6" },
        { token: "variable", foreground: "a9b7c6" },
        { token: "variable.predefined", foreground: "9876aa" },
        { token: "delimiter", foreground: "a9b7c6" },
        { token: "operator", foreground: "a9b7c6" },
    ],
    colors: {
        "editor.background": "#191a1c",
        "editor.foreground": "#a9b7c6",
        "editorLineNumber.foreground": "#4b5059",
        "editorLineNumber.activeForeground": "#a4a3a3",
        "editor.lineHighlightBackground": "#222427",
        "editor.lineHighlightBorder": "#00000000",
        "editorCursor.foreground": "#bbbbbb",
        "editor.selectionBackground": "#214283",
        "editorIndentGuide.background": "#2b2d30",
        "editorIndentGuide.activeBackground": "#5a6069",
        "editorIndentGuide.background1": "#2b2d30",
        "editorIndentGuide.activeBackground1": "#5a6069",
        "editorRuler.foreground": "#2b2d30",
        "editorGutter.background": "#191a1c",
        "scrollbar.shadow": "#00000000",
        "scrollbarSlider.background": "#ffffff1f",
        "scrollbarSlider.hoverBackground": "#ffffff38",
        "scrollbarSlider.activeBackground": "#ffffff4a",
    },
});
