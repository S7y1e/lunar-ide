import { useEffect, useState } from "react";
import { readFileText } from "../../../lib/filesystem";

export function useFileContent(path: string | null) {
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

    return [content, setContent] as const;
}
