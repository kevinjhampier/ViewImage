# Contributing to View Image

Thank you for helping maintain this continuation of ViewImage. The extension
supports current Google Images panels on Firefox and Chromium desktop browsers.

## Report a problem

Check [troubleshooting](https://kevinjhampier.github.io/ViewImage/troubleshooting.html)
and existing issues first. Include your browser and extension versions, the
Google Images URL mode (`udm=imgs`, `udm=2`, or `tbm=isch`), whether the issue occurs
in normal or private browsing, and steps to reproduce. A screenshot or a minimal,
sanitized DOM fixture is useful. Remove private search terms, account information,
cookies, tokens, and personal URLs before sharing them.

For security vulnerabilities, use the process in [SECURITY.md](SECURITY.md).

## Propose a change

1. Create a branch from `master`.
2. Use Node.js 24 and npm. Run `npm ci`.
3. Make a focused change. Preserve upstream credits and the MIT license.
4. Run `npm run check`. Changes to panel detection should include a sanitized
   regression fixture and a test of the affected behavior.
5. Test relevant browser behavior in a real Firefox or Chromium session. Automated
   DOM tests do not cover every live Google layout.
6. Open a pull request explaining the problem, resulting behavior, and validation.

Avoid reliance on Google's obfuscated CSS class names when semantic relationships
can identify the active result. Do not add permissions, tracking, remote executable
code, or runtime dependencies without explaining why they are necessary.

## Website and documentation

The website source is `scripts/build-site.mjs`, styles are in
`docs/assets/site.css`, and static output is committed in `docs/`. Regenerate
HTML and the sitemap with `npm run build:site`, and review both desktop and mobile
layouts. Keep download links consistent with the published release and describe
only features available in that version. See [docs/MAINTAINING.md](docs/MAINTAINING.md).

## Local builds

`npm run build` recreates `dist/firefox` and `dist/chromium` and clears `dist`.
Keep Mozilla-signed packages somewhere else. Rebuilding a signed XPI removes its
signature; it must be signed again before release distribution.
