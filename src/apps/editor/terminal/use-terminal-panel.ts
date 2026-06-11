import { useEffect, useState } from "react";
import { usePanelRef } from "react-resizable-panels";

export function useTerminalPanel() {
    const ref = usePanelRef();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const panel = ref.current;
        if (!panel) return;
        if (open) panel.expand();
        else panel.collapse();
    }, [open]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "`") {
                e.preventDefault();
                setOpen((value) => !value);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return {
        ref,
        open,
        toggle: () => setOpen((value) => !value),
        close: () => setOpen(false),
    };
}
