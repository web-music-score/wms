// Export named exports.
export * from "./exports.no-react";

// Export default export.
import * as DefaultExport from "./exports.no-react";
export default DefaultExport;

// __LIB_INFO__ is set by webpack.DefinePlugin.
declare const __LIB_INFO__: string;

// Log lib loaded message.
console.log("%c" + __LIB_INFO__, "background: black; color: white; padding: 2px 4px;");
