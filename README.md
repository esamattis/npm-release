# Github action to make npm (pre)releases

## Prerelease

To make npm prereleases on git push to master add
`.github/workflows/prerelease.yml`

```yaml
on:
    push:
        branches:
            - master

jobs:
    prerelease:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v1
            - name: Make prerelease to npm
              uses: epeli/npm-release@v1
              with:
                  type: prerelease
                  token: ${{ secrets.NPM_TOKEN }}
```

This bumbs the patch version and makes new release with a `next` tag. The
versions will look like `1.0.1-dev.c7f620550` where is the suffix is the git
revision the release was made from.

## Stable release

To make a stable npm release when a Github release is made add
`.github/workflows/release.yml`

```yaml
on:
    release:
        types: [published]

jobs:
    prerelease:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v1
            - name: Make stable release to npm
              uses: epeli/npm-release@v1
              with:
                  type: stable
                  token: ${{ secrets.NPM_TOKEN }}
```

This will just do the release using the version in `package.json`.

To easily make a Github release with a git tag you can use [np][] with
`--no-publish` flag.

```
npx np --no-publish
```

[np]: https://github.com/sindresorhus/np

## Running tests

If you want to run tests before the release you can add a step for it or just
put `npm test` to the `prepublishOnly` script in `package.json`.
