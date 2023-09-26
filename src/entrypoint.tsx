import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const ContainerID = "refactor-tool_container";

const attachApp = (dom: Document = document) => {
  const container = dom.getElementById(ContainerID);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  }
};

attachApp();
