import { useRef, useState, type PointerEvent } from "react";

export function useTabReorder(
    files: string[],
    onReorder: (from: number, to: number) => void
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragIndex = useRef<number | null>(null);
    const moved = useRef(false);
    const [draggingPath, setDraggingPath] = useState<string | null>(null);

    const targetIndexAt = (clientX: number): number => {
        const tabs = Array.from(
            containerRef.current?.querySelectorAll<HTMLElement>("[data-tab]") ?? []
        );
        for (let i = 0; i < tabs.length; i++) {
            const rect = tabs[i].getBoundingClientRect();
            if (clientX < rect.left + rect.width / 2) return i;
        }
        return tabs.length - 1;
    };

    const startDrag = (e: PointerEvent<HTMLDivElement>, index: number) => {
        if (e.button !== 0) return;
        dragIndex.current = index;
        moved.current = false;
        setDraggingPath(files[index]);
        containerRef.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (dragIndex.current === null) return;
        moved.current = true;
        const target = targetIndexAt(e.clientX);
        if (target !== dragIndex.current) {
            onReorder(dragIndex.current, target);
            dragIndex.current = target;
        }
    };

    const endDrag = () => {
        dragIndex.current = null;
        setDraggingPath(null);
    };

    const wasDragged = () => moved.current;

    return { containerRef, draggingPath, startDrag, onPointerMove, endDrag, wasDragged };
}
