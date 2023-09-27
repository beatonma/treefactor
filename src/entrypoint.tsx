import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "src/ui/app";

const ContainerID = "treefactor_container";

const attachApp = (dom: Document = document) => {
  const container = dom.getElementById(ContainerID);
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <div className="treefactor">
          <App />
        </div>
      </React.StrictMode>,
    );
  }
};

attachApp();
