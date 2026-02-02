
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {
    let config = {
        mode: argv.mode,
        entry: path.resolve(__dirname, "src/main.jsx"),
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "bundle.js",
            clean: true
        },
        resolve: {
            extensions: [".js", ".jsx"],
            modules: [
                path.resolve(__dirname, "./src"),
                "node_modules"
            ],
            fallback: { "crypto": false }
        },
        module: {
            rules: [
                {
                    test: /\.(js)x?$/i,
                    use: ["babel-loader"],
                },
                {
                    test: /\.css$/,
                    use: ["style-loader", "css-loader"]
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./src/index.template.ejs",
                inject: "body"
            })
        ],
        devServer: {
            static: {
                directory: path.resolve(__dirname, "dist"),
            },
            open: true
        }
    }

    if (argv.mode === "production") {
        config.optimization = {
            minimize: true,
            minimizer: [new TerserPlugin()],
        }
    }
    else {
        config.optimization = {
            minimize: false,
            minimizer: []
        }
        config.devtool = "source-map";
    }

    return config;
}
