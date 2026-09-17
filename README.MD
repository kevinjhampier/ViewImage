![Icon](icon/128.png)

# View Image — maintained Google Images fix

This repository is a modified fork of Joshua Butt's original
[`bijij/ViewImage`](https://github.com/bijij/ViewImage) extension. It keeps the
original goal—restoring a direct **View image** button to Google Images—while
updating the implementation for the current results panel.

This fork is not an official release of the upstream project.

## Main changes in this fork

- Replaces the 2018–2024 Google CSS-class checks with semantic result-panel
  detection based on the selected image and its matching destination action.
- Reads the original image directly from the active preview and rejects Google
  thumbnail URLs when no full-size image is available.
- Updates the button as users move between results without creating duplicates.
- Handles missing images, missing settings and fresh installations safely.
- Removes copied Google event and tracking attributes from the generated link.
- Adds repeatable Firefox/Chromium builds, DOM unit tests, ESLint and Firefox
  manifest validation.

## Development

Requirements: Node.js 20 or later and npm.

```shell
npm install
npm run check
```

Build unpacked extensions with:

```shell
npm run build
```

The generated directories are:

- `dist/firefox`
- `dist/chromium`

For a temporary Firefox test, open `about:debugging`, choose **This Firefox**,
select **Load Temporary Add-on**, and open `dist/firefox/manifest.json`.

## Original project

- Upstream source: <https://github.com/bijij/ViewImage>
- Original author: Joshua Butt
- Original icon: Daniel Hickman
- Licence: MIT
