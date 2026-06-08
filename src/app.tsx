import { useState } from "react";
import Home from "./apps/home";
import Editor from "./apps/editor";

export default function App() {
    const [screen, setScreen] = useState<"home" | "editor">("home");
    const [currentPath, setCurrentPath] = useState<string | null>(null);

    const openEditor = (path: string) => {
        setCurrentPath(path);
        setScreen("editor");
    };

    if (screen === "editor" && currentPath) {
        return <Editor path={currentPath} onBack={() => setScreen("home")} />;
    }

    return <Home onOpenProject={openEditor} />;
}