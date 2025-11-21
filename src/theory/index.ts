export * from "./chord";
export * from "./guitar";
export * from "./interval";
export * from "./note";
export * from "./scale"
export * from "./key-signature";
export * from "./time-signature";
export * from "./tempo";
export * from "./rhythm";
export * from "./types";

import { init as initCore } from "web-music-score/core";

initCore();
