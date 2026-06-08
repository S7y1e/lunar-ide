import style from "./style.module.scss"
import FileTreeNode from "./file-tree-node";
import { ActivityViewId } from "./activity-views";
import {useEffect, useState} from "react";
import {FileNode, readDirectory} from "../../lib/filesystem";

type Props = {
    currentWindow: ActivityViewId | null;
    path: string;
};

export default function Sidebar({ currentWindow, path }: Props) {
    const [nodes, setNodes] = useState<FileNode[]>([]);

    useEffect(() => {
        readDirectory(path).then(setNodes);
    }, [path]);

    if (!currentWindow) return null;

    return (
        <div className={style.sidebar}>
            {currentWindow === "project" &&
                nodes.map((node) => (
                    <FileTreeNode key={node.path} node={node} />
                ))}
        </div>
    );
}