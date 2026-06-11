import * as monaco from "monaco-editor";

export type LspPosition = { line: number; character: number };
export type LspRange = { start: LspPosition; end: LspPosition };

export type LspDiagnostic = {
    range: LspRange;
    severity?: number;
    message: string;
    source?: string;
};

type LspDocumentation = string | { kind?: string; value: string } | undefined;

export type LspCompletionItem = {
    label: string;
    kind?: number;
    detail?: string;
    documentation?: LspDocumentation;
    insertText?: string;
    insertTextFormat?: number;
    sortText?: string;
    filterText?: string;
};

export type LspCompletionResult =
    | LspCompletionItem[]
    | { items: LspCompletionItem[] }
    | null;

type LspMarkup = string | { language?: string; kind?: string; value: string };

export type LspHover = {
    contents: LspMarkup | LspMarkup[];
    range?: LspRange;
} | null;

export function toLspPosition(position: monaco.IPosition): LspPosition {
    return { line: position.lineNumber - 1, character: position.column - 1 };
}

const SEVERITY: Record<number, monaco.MarkerSeverity> = {
    1: monaco.MarkerSeverity.Error,
    2: monaco.MarkerSeverity.Warning,
    3: monaco.MarkerSeverity.Info,
    4: monaco.MarkerSeverity.Hint,
};

export function toMarker(d: LspDiagnostic): monaco.editor.IMarkerData {
    return {
        severity: SEVERITY[d.severity ?? 1] ?? monaco.MarkerSeverity.Error,
        message: d.message,
        source: d.source,
        startLineNumber: d.range.start.line + 1,
        startColumn: d.range.start.character + 1,
        endLineNumber: d.range.end.line + 1,
        endColumn: d.range.end.character + 1,
    };
}

const COMPLETION_KIND: Record<number, monaco.languages.CompletionItemKind> = {
    1: monaco.languages.CompletionItemKind.Text,
    2: monaco.languages.CompletionItemKind.Method,
    3: monaco.languages.CompletionItemKind.Function,
    4: monaco.languages.CompletionItemKind.Constructor,
    5: monaco.languages.CompletionItemKind.Field,
    6: monaco.languages.CompletionItemKind.Variable,
    7: monaco.languages.CompletionItemKind.Class,
    8: monaco.languages.CompletionItemKind.Interface,
    9: monaco.languages.CompletionItemKind.Module,
    10: monaco.languages.CompletionItemKind.Property,
    11: monaco.languages.CompletionItemKind.Unit,
    12: monaco.languages.CompletionItemKind.Value,
    13: monaco.languages.CompletionItemKind.Enum,
    14: monaco.languages.CompletionItemKind.Keyword,
    15: monaco.languages.CompletionItemKind.Snippet,
    16: monaco.languages.CompletionItemKind.Color,
    17: monaco.languages.CompletionItemKind.File,
    18: monaco.languages.CompletionItemKind.Reference,
    19: monaco.languages.CompletionItemKind.Folder,
    20: monaco.languages.CompletionItemKind.EnumMember,
    21: monaco.languages.CompletionItemKind.Constant,
    22: monaco.languages.CompletionItemKind.Struct,
    23: monaco.languages.CompletionItemKind.Event,
    24: monaco.languages.CompletionItemKind.Operator,
    25: monaco.languages.CompletionItemKind.TypeParameter,
};

export function toCompletionList(
    result: LspCompletionResult,
    model: monaco.editor.ITextModel,
    position: monaco.IPosition
): monaco.languages.CompletionList {
    const items = Array.isArray(result) ? result : result?.items ?? [];
    const word = model.getWordUntilPosition(position);
    const range: monaco.IRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
    };
    return {
        suggestions: items.map((item) => ({
            label: item.label,
            kind:
                COMPLETION_KIND[item.kind ?? 1] ??
                monaco.languages.CompletionItemKind.Text,
            insertText: item.insertText ?? item.label,
            insertTextRules:
                item.insertTextFormat === 2
                    ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                    : undefined,
            detail: item.detail,
            documentation: docToMarkdown(item.documentation),
            sortText: item.sortText,
            filterText: item.filterText,
            range,
        })),
    };
}

export function toHover(result: LspHover): monaco.languages.Hover | null {
    if (!result) return null;
    const parts = Array.isArray(result.contents)
        ? result.contents
        : [result.contents];
    const contents = parts
        .map(markupToString)
        .filter((value) => value.length > 0)
        .map((value) => ({ value }));
    if (contents.length === 0) return null;
    const range = result.range
        ? {
              startLineNumber: result.range.start.line + 1,
              startColumn: result.range.start.character + 1,
              endLineNumber: result.range.end.line + 1,
              endColumn: result.range.end.character + 1,
          }
        : undefined;
    return { contents, range };
}

function docToMarkdown(
    doc: LspDocumentation
): monaco.IMarkdownString | string | undefined {
    if (!doc) return undefined;
    if (typeof doc === "string") return doc;
    return { value: doc.value };
}

function markupToString(markup: LspMarkup): string {
    if (typeof markup === "string") return markup;
    if (markup.language) {
        return "```" + markup.language + "\n" + markup.value + "\n```";
    }
    return markup.value ?? "";
}
