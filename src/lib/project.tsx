import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

/** Immutable view of the backend Project Model. Mirrors `ProjectSnapshot` in Rust. */
export type ProjectSnapshot = {
    root: string;
    name: string;
    projectFile: string;
    /** Sync backend pinned by lunar.toml, or null to use the frontend default. */
    syncBackend: string | null;
};

export function openProject(root: string): Promise<ProjectSnapshot> {
    return invoke("project_open", { root });
}

export function closeProject(): Promise<void> {
    return invoke("project_close");
}

export function getProjectSnapshot(): Promise<ProjectSnapshot | null> {
    return invoke("project_snapshot");
}

/** A node in the project's DataModel tree. Mirrors `DataModelNode` in Rust. */
export type DataModelNode = {
    name: string;
    className: string;
    filePaths: string[];
    children: DataModelNode[];
};

/**
 * The parsed DataModel tree for the open project, or `null` when none is open or
 * no sourcemap has been generated yet. The Project Model owns the parse; this is
 * the query surface later phases (e.g. the Studio-aware tree) build on.
 */
export function getProjectDataModel(): Promise<DataModelNode | null> {
    return invoke("project_data_model");
}

const ProjectContext = createContext<ProjectSnapshot | null>(null);

/**
 * Opens `root` as the active project in the backend for the lifetime of the
 * subtree, and exposes the resulting snapshot via {@link useProject}. Switching
 * projects (a new `root`) closes the old one and opens the new; unmounting
 * (returning home) closes it.
 *
 * The `path` prop threaded through the editor still works — this provider is
 * additive, so consumers can migrate to `useProject()` opportunistically.
 */
export function ProjectProvider({
    root,
    children,
}: {
    root: string;
    children: ReactNode;
}) {
    const [snapshot, setSnapshot] = useState<ProjectSnapshot | null>(null);

    useEffect(() => {
        let active = true;
        const unlisteners: Array<() => void> = [];

        openProject(root).then((snap) => {
            if (active) setSnapshot(snap);
        });

        // Later phases (sourcemap, manifest) mutate the model in place and emit
        // `project://changed`; refetch the snapshot so the UI stays in sync.
        listen("project://changed", () => {
            getProjectSnapshot().then((snap) => {
                if (active && snap) setSnapshot(snap);
            });
        }).then((un) => unlisteners.push(un));

        return () => {
            active = false;
            unlisteners.forEach((un) => un());
            closeProject().catch(() => {});
        };
    }, [root]);

    return (
        <ProjectContext.Provider value={snapshot}>
            {children}
        </ProjectContext.Provider>
    );
}

/** The active project snapshot, or `null` until the backend has opened it. */
export function useProject(): ProjectSnapshot | null {
    return useContext(ProjectContext);
}
