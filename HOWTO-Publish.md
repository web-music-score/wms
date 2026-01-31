# HOW-TO Publish

## Pre-Release
    // Update CHANGELOG.md

    // Version: "X.Y.Z-pre.N"`

    // Install
    npm install --workspaces

    // Build
    npm run build

    // Commit
    git commit -a -m "vX.Y.Z-pre.N"

    // Add Tag
    git tag vX.Y.Z-pre.N

    // Login
    npm login

    // Publish
    npm publish --access public --tag next

    // Bump version


## Latest
    // Update CHANGELOG.md

    // Version: "X.Y.Z"`

    // Install
    npm install --workspaces

    // Build
    npm run build

    // Commit
    git commit -a -m "vX.Y.Z"

    // Add Tag
    git tag vX.Y.Z

    // Login
    npm login

    // Publish
    npm publish --access public

    // Add "next" tag when publishing first stable vX.Y.0 (not for patches)
    npm dist-tag add web-music-score@X.Y.Z next

    // Bump version
