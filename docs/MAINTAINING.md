# Maintaining the website

The site is a dependency-free static website served by GitHub Pages from
`master:/docs`. Its canonical URL is https://kevinjhampier.github.io/ViewImage/.
The extension and website have separate build commands.

## Updating content

Edit `scripts/build-site.mjs` and `docs/assets/site.css`, then run:

```sh
npm run build:site
npm run check:site
npm run preview:site
```

Commit the generated HTML, sitemap, and robots file with the source changes.
The preview server listens at `http://127.0.0.1:4178/ViewImage/`.
The site generator reads the extension version from `manifest.base.json`.
When publishing a new version, confirm that the corresponding release assets
exist before updating download links. Update the changelog and signed-package
wording if the signing or distribution method changes.

`docs/assets/example.png` is the user-supplied demonstration screenshot.
`docs/assets/social-preview.png` is a 1280 x 640 repository/site sharing card.
It is set in the site's Open Graph/Twitter tags and should also be uploaded at
GitHub repository Settings → Social preview → Edit → Upload an image.
The sharing card is a real browser capture of `docs/assets/social-preview.html`,
which uses the supplied Google Images screenshot rather than a placeholder.
To regenerate it on Windows, use Node.js 24, Microsoft Edge, and Playwright:

```sh
npm install --no-save --package-lock=false playwright
npm run render:social
```

Playwright is an optional artwork tool, not an extension dependency. The script
starts an isolated headless Edge instance, waits for fonts and both images, and
writes a 1280 x 640 PNG. An existing Playwright installation can instead be used
by setting `PLAYWRIGHT_MODULE` to its module directory. The current image was
rendered with Playwright 1.62.1 and the Windows Segoe UI / Georgia fonts.

## Google Search Console

The current URL-prefix property uses Google's **HTML file** verification method.
Keep `docs/google5528e3117fb93b11.html` in the published site, including after
verification succeeds. It must remain accessible at
`https://kevinjhampier.github.io/ViewImage/google5528e3117fb93b11.html`.
It is a verification resource, not a content page, and is excluded from the sitemap
and the content-page metadata checks. After the file is deployed, press **Verify**
in Search Console and submit the sitemap URL below.

The HTML-tag alternative remains available if a different property needs it:

1. Create a **URL-prefix** property for exactly
   `https://kevinjhampier.github.io/ViewImage/` in
   [Search Console](https://search.google.com/search-console).
2. Choose the **HTML tag** verification method. The verification token is tied
   to the owner's Google account and cannot be invented or borrowed.
3. Save the token's `content` value in `docs/search-console-verification.txt`.
   The generator will add a real `google-site-verification` meta tag to the
   home page when that file exists. Keep it in the repository after verification.
4. Run `npm run build:site`, commit, and publish. Confirm that the tag is visible
   in the deployed home-page source before pressing **Verify**.
5. Submit `https://kevinjhampier.github.io/ViewImage/sitemap.xml` under **Sitemaps**.
6. Inspect the home-page URL and request indexing. Discovery, indexing, and
   search appearance are controlled by Google, and are not immediate or guaranteed.

The project path does not control the domain-root `robots.txt` on github.io.
The site also links the sitemap directly from its HTML metadata.

## Structured data

The home page includes SoftwareApplication / BrowserApplication JSON-LD with
the actual version, platform support, free price, download link, MIT license,
maintainer, screenshot, and source repository. It does not invent ratings or
reviews. Without genuine review/rating data it does not claim eligibility for
Google's software-app rich results.
