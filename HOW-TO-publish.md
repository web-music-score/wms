# HOW-TO Publish

## Pre-Release
    // Set Version
    Set package.json "version" to "X.Y.Z-pre.N"`

    // Commit
    git commit -a -m "vX.Y.Z-pre.N"

    // Add Tag
    git tag vX.Y.Z-pre.N

    // Build
    npm run build

    // Login
    npm login

    // Publish
    npm publish --access public --tag next

## Latest
    // Set Version
    Set package.json "version" to "X.Y.Z"`

    // Commit
    git commit -a -m "vX.Y.Z"

    // Add Tag
    git tag vX.Y.Z

    // Build
    npm run build

    // Login
    npm login

    // Publish
    npm publish --access public

    // Add "next" Tag
    npm dist-tag add web-music-score@X.Y.Z next
