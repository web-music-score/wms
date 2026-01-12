import PackageJson from "../../package.json";
import "./custom-css";

export * from "./error";

declare const __LIB_VERSION__: string;
declare const __LIB_INFO__: string;

export function getLibVersion(): string {
    return __LIB_VERSION__;
}

export function getLibInfo(): string {
    return __LIB_INFO__;
}

let initialized = false;

export function init(): void {
    if (initialized)
        return;
    
    initialized = true;

    console.log(`%c${getLibInfo()} initialized.`, `background: black; color: white; padding: 2px;`);
}
