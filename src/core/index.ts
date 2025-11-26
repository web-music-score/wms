import "./custom-css";

export * from "./error";

declare const __LIB_INFO__: string;

let initialized = false;

export function init(): void {
    if (initialized) {
        return;
    }
    
    initialized = true;

    console.log("%c" + __LIB_INFO__ + " initialized.", "background: black; color: white; padding: 2px;");
}