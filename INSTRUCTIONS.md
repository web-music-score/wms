# Publish web-music-score

## Update Changelog
 `git log --pretty="- %s"`

## Update Version Numbers
- Change version in package.json: `"5.3.0"`
- (For major update change version also for all apps)
- Create git commit: e.g. `git commit -a -m "v5.3.0"`
- Create git tag: e.g. `git tag v5.3.0`

## Build
`npm run build`

## Test Package
`npm pack`
`npm pack --dry-run`

## Publish
`npm login`
`npm publish --access public`
