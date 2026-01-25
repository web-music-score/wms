# HOW-TO Publish

## Pre-Release
    // Update CHANGELOG.md

    // Update Versions
    Set package.json "version" to "X.Y.Z-pre.N"`

    // Install
    npm run install

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

## Latest/Patches
    // Update CHANGELOG.md

    // Update Versions
    Set package.json "version" to "X.Y.Z"`

    // Install
    npm run install

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
