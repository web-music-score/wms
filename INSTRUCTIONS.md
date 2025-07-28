# Publish web-music-score

    cd packages/web-music-score

    // Update changelog
    git log --pretty="- %s"

    // Update version number
    npm version major|minor|patch

    // Build production version
    npm run build

    // Test package
    npm pack

    // Publish
    npm login
    npm publish --access public
