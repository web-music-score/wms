# HOW-TO Publish

## Patch
    // Update CHANGELOG.md

    // Update Versions
    Set package.json "version" to "6.3.Z"

    // Install
    npm install --workspaces

    // Build
    npm run build

    // Commit
    git commit -a -m "v6.3.Z"

    // Add Tag
    git tag vX.Y.Z

    // Login
    npm login

    // Publish
    npm publish --access public

    // Bump versions
