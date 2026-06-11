import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
// @ts-ignore
import "./global.css";

console.log(
    "%cLUNAR-MARKER-9F3A — fresh frontend loaded",
    "color:#3574f0;font-weight:bold;font-size:14px"
);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
);
