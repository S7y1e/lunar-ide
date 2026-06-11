import { useEffect, useState } from "react";

export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
                e.preventDefault();
                setIsOpen(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
    };
}
