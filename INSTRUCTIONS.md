# Publish web-music-score

## Update Changelog
 `git log --pretty="- %s"`

## Update Version Numbers
- Change version in package.json: `"MAJ.MIN.PATCH"`
- (For major update change version also for all apps)
- Create git commit: e.g. `git commit -a -m "vMAJ.MIN.PATCH"`
- Create git tag: e.g. `git tag vMAJ.MIN.PATCH`

## Build
`npm run build`

## Test Package
`npm pack`
`npm pack --dry-run`

## Publish
`npm login`
`npm publish --access public`
