// Export all except react-ui
export * from "./core";
export * from "./pieces";

// __LIB_INFO__ is set by webpack.DefinePlugin.
declare const __LIB_INFO__: string;

// Log lib loaded message.
console.log("%c" + __LIB_INFO__, "background: black; color: white; padding: 2px 4px;");
