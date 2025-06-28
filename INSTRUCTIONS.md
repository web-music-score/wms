# Instructions

## Scripts

### Develop Exmple: Featurs Demo

    npm run watch -w packages/web-music-score
    npm run start -w apps/features-demo

### Generate Docs: Web Music Score

    npm run docs -w packages/web-music-score

### Example Build Scripts

    npm run build:dev -w packages/web-music-score
    npm run build:prod -w packages/web-music-score

    npm run build:dev -w apps/features-demo
    npm run build:prod -w apps/features-demo

## Publish web-music-score

    cd packages/web-music-score

    // Update changelog
    git log --pretty="- %s"

    // Update version number
    npm version major|minor|patch

    // Build production version
    npm run build:prod

    // Test package
    npm pack

    // Publish
    npm login
    npm publish --access public
