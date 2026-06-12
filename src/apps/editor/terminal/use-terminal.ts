import { useEffect, useRef } from "react";
import { invoke, Channel } from "@tauri-apps/api/core";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { readToken, subscribeTheme } from "../../../lib/theme";

let counter = 0;

function xtermTheme() {
    return {
        background: readToken("bg-window"),
        foreground: readToken("editor-fg"),
        cursor: readToken("text-bright"),
    };
}

export function useTerminal(cwd: string) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const term = new Terminal({
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            cursorBlink: true,
            theme: xtermTheme(),
        });
        const unsubscribeTheme = subscribeTheme(() => {
            term.options.theme = xtermTheme();
        });
        const fit = new FitAddon();
        term.loadAddon(fit);
        term.open(container);
        fit.fit();

        const id = `term-${counter++}`;

        const output = new Channel<number[]>();
        output.onmessage = (bytes) => term.write(new Uint8Array(bytes));

        invoke("terminal_open", {
            id,
            cols: term.cols || 80,
            rows: term.rows || 24,
            cwd,
            output,
        }).catch((e) => term.write(`\r\n[terminal] ${e}\r\n`));

        const dataSub = term.onData((data) =>
            invoke("terminal_write", { id, data }).catch(() => {})
        );

        const observer = new ResizeObserver(() => {
            if (container.clientHeight < 24 || container.clientWidth < 24) return;
            fit.fit();
            invoke("terminal_resize", {
                id,
                cols: term.cols,
                rows: term.rows,
            }).catch(() => {});
        });
        observer.observe(container);

        return () => {
            unsubscribeTheme();
            observer.disconnect();
            dataSub.dispose();
            invoke("terminal_close", { id }).catch(() => {});
            term.dispose();
        };
    }, [cwd]);

    return containerRef;
}
