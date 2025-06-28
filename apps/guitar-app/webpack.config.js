
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = (env, argv) => {

    let config = {
        mode: argv.mode,
        entry: path.resolve(__dirname, "src/main.ts"),
        output: {
            path: path.resolve(__dirname, "dist"),
            filename: "bundle.js",
            clean: true
        },
        resolve: {
            extensions: [".ts", ".tsx", ".js"],
            modules: [
                path.resolve(__dirname, "./src"),
                "node_modules"
            ],
            plugins: [],
            fallback: { "crypto": false }
        },
        module: {
            rules: [
                {
                    test: /\.(js)x?$/i,
                    use: ["babel-loader"],
                },
                {
                    test: /\.(ts)x?$/i,
                    use: ["babel-loader", "ts-loader"]
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
                            }
                        }
                    ]
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: "./src/index.template.ejs",
                inject: "body",
                favicon: "./src/favicon.ico"
            })
        ],
        devServer: {
            static: {
                directory: path.resolve(__dirname, "dist"),
            },
            open: true
        }
    }

    if (argv.mode == 'production') {
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
        config.devtool = 'source-map';
    }

    return config;
}