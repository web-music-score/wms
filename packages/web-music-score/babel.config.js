module.exports = function (api) {

    const isESM = api.env("esm");
    const isCJS = api.env("cjs");
    const isUMD = api.env("umd");

    const targets = isESM
        ? {
            browsers: [
                "last 2 Chrome versions",
                "last 2 Firefox versions",
                "last 2 Safari versions",
                "last 2 Edge versions"
            ]
        }
        : {
            ie: "11"
        }

    return {
        "presets": [
            [
                "@babel/preset-env",
                {
                    targets: targets,
                    //debug: true,
                    modules: false,
                    useBuiltIns: false,
                    corejs: false
                }
            ]
        ],
        "plugins": []
    };
};
