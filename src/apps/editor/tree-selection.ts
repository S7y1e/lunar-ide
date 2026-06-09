import { createContext } from "react";

export type TreeSelection = {
    selected: string | null;
    select: (path: string) => void;
};

export const TreeSelectionContext = createContext<TreeSelection>({
    selected: null,
    select: () => {},
});
