// Export named exports.
export * from "./exports";

// Export default export.
import * as DefaultExport from "./exports";
export default DefaultExport;

// __LIB_INFO__ is set by webpack.DefinePlugin.
declare const __LIB_INFO__: string;

// Log lib loaded message.
console.log("Loaded: " + __LIB_INFO__);
