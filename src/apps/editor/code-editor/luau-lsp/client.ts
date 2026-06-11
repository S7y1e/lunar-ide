import { LspConnection } from "./lsp-connection";
import { resolveSection } from "./config";
import {
    LspPosition,
    LspDiagnostic,
    LspCompletionResult,
    LspCompletionItem,
    LspHover,
} from "./convert";

const SIDECAR = "binaries/luau-lsp";

export type DiagnosticsListener = (uri: string, diagnostics: LspDiagnostic[]) => void;

export class LuauLspClient {
    private conn = new LspConnection();
    private versions = new Map<string, number>();
    private resolveReady!: () => void;
    private ready = new Promise<void>((resolve) => (this.resolveReady = resolve));

    onDiagnostics: DiagnosticsListener = () => {};

    constructor(
        private rootUri: string,
        private getConfig: () => Record<string, unknown>,
        private definitionsPath: string | null = null
    ) {}

    async start(): Promise<void> {
        const args = ["lsp", "--stdio"];
        if (this.definitionsPath) args.push("--definitions", this.definitionsPath);
        console.log("[luau-lsp] spawning sidecar", args);
        await this.conn.start(SIDECAR, args);
        console.log("[luau-lsp] sidecar spawned, sending initialize");

        this.conn.onRequest("workspace/configuration", (params) => {
            const items =
                (params as { items?: { section?: string }[] }).items ?? [];
            const root = this.getConfig();
            return items.map((item) => resolveSection(root, item.section));
        });
        this.conn.onRequest("client/registerCapability", () => null);
        this.conn.onRequest("client/unregisterCapability", () => null);
        this.conn.onRequest("window/workDoneProgress/create", () => null);

        this.conn.onNotification("textDocument/publishDiagnostics", (params) => {
            const p = params as { uri: string; diagnostics: LspDiagnostic[] };
            this.onDiagnostics(p.uri, p.diagnostics ?? []);
        });
        this.conn.onNotification("window/logMessage", (params) =>
            console.log("[luau-lsp]", (params as { message?: string }).message)
        );
        this.conn.onNotification("window/showMessage", (params) =>
            console.log("[luau-lsp]", (params as { message?: string }).message)
        );

        const result = await this.conn.sendRequest("initialize", {
            processId: null,
            clientInfo: { name: "lunar-ide" },
            rootUri: this.rootUri,
            workspaceFolders: [{ uri: this.rootUri, name: "workspace" }],
            capabilities: clientCapabilities(),
        });
        console.log("[luau-lsp] initialized", result);

        this.conn.sendNotification("initialized", {});
        this.conn.sendNotification("workspace/didChangeConfiguration", {
            settings: this.getConfig(),
        });
        this.resolveReady();
    }

    /** Re-push configuration so the server re-pulls the latest values. */
    notifyConfigChanged(): void {
        this.ready.then(() =>
            this.conn.sendNotification("workspace/didChangeConfiguration", {
                settings: this.getConfig(),
            })
        );
    }

    didOpen(uri: string, text: string): void {
        this.ready.then(() => {
            this.versions.set(uri, 1);
            this.conn.sendNotification("textDocument/didOpen", {
                textDocument: { uri, languageId: "luau", version: 1, text },
            });
        });
    }

    didChange(uri: string, text: string): void {
        this.ready.then(() => {
            const version = (this.versions.get(uri) ?? 1) + 1;
            this.versions.set(uri, version);
            this.conn.sendNotification("textDocument/didChange", {
                textDocument: { uri, version },
                contentChanges: [{ text }],
            });
        });
    }

    didClose(uri: string): void {
        this.versions.delete(uri);
        this.ready.then(() =>
            this.conn.sendNotification("textDocument/didClose", {
                textDocument: { uri },
            })
        );
    }

    async completion(
        uri: string,
        position: LspPosition
    ): Promise<LspCompletionResult> {
        await this.ready;
        return this.conn.sendRequest("textDocument/completion", {
            textDocument: { uri },
            position,
        });
    }

    async completionResolve(item: LspCompletionItem): Promise<LspCompletionItem> {
        await this.ready;
        return this.conn.sendRequest("completionItem/resolve", item);
    }

    async hover(uri: string, position: LspPosition): Promise<LspHover> {
        await this.ready;
        return this.conn.sendRequest("textDocument/hover", {
            textDocument: { uri },
            position,
        });
    }

    async stop(): Promise<void> {
        try {
            await this.conn.sendRequest("shutdown");
        } catch {}
        this.conn.sendNotification("exit");
        await this.conn.stop();
    }
}

function clientCapabilities() {
    return {
        textDocument: {
            synchronization: { dynamicRegistration: false },
            publishDiagnostics: { relatedInformation: true },
            completion: {
                contextSupport: true,
                completionItem: {
                    snippetSupport: true,
                    documentationFormat: ["markdown", "plaintext"],
                    resolveSupport: { properties: ["additionalTextEdits", "documentation", "detail"] },
                },
            },
            hover: { contentFormat: ["markdown", "plaintext"] },
        },
        workspace: {
            configuration: true,
            didChangeConfiguration: { dynamicRegistration: false },
            workspaceFolders: true,
        },
    };
}
