import "core-js/stable";
import  "regenerator-runtime/runtime";

import * as React from "react";
import *as ReactDOM from "react-dom/client";
import ExampleApp from "./example-app";

const rootElem = document.getElementById('root');

if (!rootElem) {
    throw "Root element not found!";
}

const root = ReactDOM.createRoot(rootElem);

root.render(
    <React.StrictMode>
        <ExampleApp />
    </React.StrictMode>
);
