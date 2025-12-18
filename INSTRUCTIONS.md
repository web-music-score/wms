# Publish web-music-score

## Update Changelog
    git log --pretty="- %s"

## Update Version Numbers
    // Change version in package.json: "x.y.z"
    // (For major update change version also for all apps)
    
    // Create git commit:
    git commit -a -m "vx.y.z"
    
    // Create git tag:
    git tag vx.y.z

## Build
    npm run build

## Test Package
    npm pack
    npm pack --dry-run

## Publish
    npm login
    npm publish --access public
