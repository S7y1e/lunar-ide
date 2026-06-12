import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import { initTheme } from "./lib/theme";
// @ts-ignore
import "./global.css";

// Apply the saved theme before first paint so there's no flash of the default.
initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
