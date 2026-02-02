require("core-js/stable");
require("regenerator-runtime/runtime");

const React = require("react");
const ReactDOM = require("react-dom/client");
const  ExampleApp = require("./example-app");

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
