const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const packageJson = require("./package.json");

const makeConfig = ({ env, argv, format, filename, libraryType }) => {
    const isDevelopment = argv.mode === "development";
    const isMinified = filename.includes(".min.");
    const isModule = libraryType === "module";
    const entry = format === "umd" ? "src/index.umd.ts" : "src/index.full.ts";

    return {
        mode: argv.mode,
        entry: path.resolve(__dirname, entry),
        output: {
            filename,
            path: path.resolve(__dirname, "dist"),
            library: {
                // Set library name to "BraceFormat" for "umd" only, to enable BraceFormat.format(...) in browser.
                // Do not set library name for "cjs", or it would require const Fmt = require(...).BraceFormat;
                name: libraryType === "umd" ? "WebMusicScore" : undefined,
                type: libraryType,
                // Importing default export on esm failed if "exports" was set to "default".
                export: isModule ? undefined : "default",
            },
            module: isModule,
            environment: { module: isModule },
            chunkFormat: isModule ? "module" : undefined,
            globalObject: "this"
        },
        experiments: {
            outputModule: isModule
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js", ".jsx"],
            modules: [
                path.resolve(__dirname, "./src"),
                "node_modules"
            ]
        },
        module: {
            rules: [
                {
                    test: /\.(js)x?$/i,
                    use: [{
                        loader: "babel-loader",
                        options: { envName: format }
                    }],
                },
                {
                    test: /\.(ts)x?$/i,
                    use: [
                        {
                            loader: "babel-loader",
                            options: { envName: format }
                        },
                        "ts-loader"
                    ],
                },
                {
                    test: /\.css$/i,
                    use: ["style-loader", "css-loader"]
                },
                {
                    test: /\.(png|jpg|gif|mp3)$/i,
                    use: [
                        {
                            loader: 'url-loader',
                            options: {
                                limit: Infinity,
                            },
                        },
                    ],
                }
            ]
        },
        externals: {
            // Note! UMD bundle does not include react components.
            react: "react"
        },
        plugins: [
            new webpack.BannerPlugin({
                banner: `WebMusicScore v${packageJson.version} | (c) 2023 PahkaSoft | MIT License | Includes: Tone.js (MIT License)`
            }),
            new webpack.DefinePlugin({
                __LIB_INFO__: JSON.stringify(`WebMusicScore v${packageJson.version} (${format})`)
            }),
        ],
        optimization: {
            minimize: isMinified,
            minimizer: isMinified ? [new TerserPlugin({ extractComments: false })] : undefined,
        },
        devtool: isDevelopment ? "source-map" : false,
        performance: { hints: false },
        stats: "normal"
    }
}

module.exports = (env, argv) => {

    const esmConfig = makeConfig({ env, argv, format: "esm", filename: "index.esm.mjs", libraryType: "module" });
    const cjsConfig = makeConfig({ env, argv, format: "cjs", filename: "index.cjs.js", libraryType: "commonjs2" });
    const umdConfig = makeConfig({ env, argv, format: "umd", filename: "index.umd.min.js", libraryType: "umd" });

    switch (env.target) {
        case "esm":
            return esmConfig;
        case "cjs":
            return cjsConfig;
        case "umd":
            return umdConfig;
        default:
            return [esmConfig, cjsConfig, umdConfig];
    }
}
