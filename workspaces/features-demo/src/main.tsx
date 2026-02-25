import "bootstrap/dist/css/bootstrap.min.css";

import * as React from "react";
import *as ReactDOM from "react-dom/client";
import DemoApp from "./demo-app";

const rootElem = document.getElementById('root');

if (!rootElem) throw "Root element not found!";

const root = ReactDOM.createRoot(rootElem);

root.render(
    <React.StrictMode>
        <DemoApp />
    </React.StrictMode>
);
