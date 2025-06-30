"use strict";

module.exports = function (api) {
    api.cache(true); // Enables caching for faster builds

    return {
        presets: [
            [
                "@babel/preset-env",
                {
                    // ES6
                    targets: {
                        chrome: "51",
                        firefox: "54",
                        edge: "15",
                        safari: "10",
                        ios: "10"
                    },
                    modules: false,
                    useBuiltIns: "entry",
                    corejs: 3,
                    shippedProposals: false
                }
            ],
            [
                "@babel/preset-react"
            ]

        ],
        plugins: []
    };
};
