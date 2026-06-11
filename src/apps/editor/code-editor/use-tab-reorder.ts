import { useRef, useState, type PointerEvent } from "react";

export function useTabReorder(
    files: string[],
    onReorder: (from: number, to: number) => void,
    onSelect: (path: string) => void
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const dragIndex = useRef<number | null>(null);
    const pressedPath = useRef<string | null>(null);
    const pointerId = useRef<number | null>(null);
    const moved = useRef(false);
    const startX = useRef(0);
    const [draggingPath, setDraggingPath] = useState<string | null>(null);

    // Movement (px) required before a press is treated as a drag instead of a click.
    const DRAG_THRESHOLD = 4;

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
        pressedPath.current = files[index];
        pointerId.current = e.pointerId;
        moved.current = false;
        startX.current = e.clientX;
        setDraggingPath(files[index]);
        containerRef.current?.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
        if (dragIndex.current === null) return;
        if (!moved.current && Math.abs(e.clientX - startX.current) < DRAG_THRESHOLD) {
            return;
        }
        moved.current = true;
        const target = targetIndexAt(e.clientX);
        if (target !== dragIndex.current) {
            onReorder(dragIndex.current, target);
            dragIndex.current = target;
        }
    };

    const endDrag = (e: PointerEvent<HTMLDivElement>) => {
        if (dragIndex.current === null) return;
        // A press without enough movement is a click: select the pressed tab.
        if (!moved.current && pressedPath.current) {
            onSelect(pressedPath.current);
        }
        if (pointerId.current !== null) {
            containerRef.current?.releasePointerCapture(pointerId.current);
        }
        dragIndex.current = null;
        pressedPath.current = null;
        pointerId.current = null;
        setDraggingPath(null);
        void e;
    };

    return { containerRef, draggingPath, startDrag, onPointerMove, endDrag };
}
