export * from "./pub";

import { init as initCore } from "web-music-score/core";

initCore();

import { registerAllWmsElements } from "./custom-element";

registerAllWmsElements();
