# Publish web-music-score

## Update Changelog
 `git log --pretty="- %s"`

## Update Version Numbers
To create patch update: `npm version patch`

To create minor update: `npm version minor`

To create major update:
- Change version in package.json for main package and all apps: e.g. `"4.0.0"`
- Create git commit: e.g. `git commit -a -m "v4.0.0"`
- Create git tag: e.g. `git tag v4.0.0`

## Build
`npm run build`

## Test Package
`npm pack`

## Publish
`npm login`
`npm publish --access public`
