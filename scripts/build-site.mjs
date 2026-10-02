import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const site = 'https://kevinjhampier.github.io/ViewImage/';
const repo = 'https://github.com/kevinjhampier/ViewImage';
const { version } = JSON.parse(readFileSync(path.join(root, 'manifest.base.json'), 'utf8'));
const release = `${repo}/releases/tag/v${version}`;
const firefox = `${repo}/releases/download/v${version}/ViewImage-${version}-firefox.xpi`;
const chromium = `${repo}/releases/download/v${version}/ViewImage-${version}-chromium.zip`;
const verificationPath = path.join(docs, 'search-console-verification.txt');
const verification = existsSync(verificationPath) ? readFileSync(verificationPath, 'utf8').trim() : '';
const escapeHTML = text => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[character]));

const arrow = '<span aria-hidden="true">↗</span>';
const downloads = `<div class="actions"><a class="button primary" href="${firefox}">Install for Firefox ${arrow}</a><a class="button secondary" href="install.html#chromium">Install for Chromium ${arrow}</a></div>`;
const home = `
<section class="hero">
  <div class="hero-copy">
    <p class="eyebrow"><span class="status-dot"></span> A maintained browser extension</p>
    <h1>One click.<br>The <em>actual</em> image.</h1>
    <p class="lead">Bring the <strong>View image</strong> button back to Google Images. Open the original image directly, without the extra detour.</p>
    ${downloads}
    <p class="download-note">Firefox: Mozilla-signed XPI · Chromium: load unpacked<br>Free &amp; open source · Desktop browsers · v${version}</p>
  </div>
  <figure class="demo">
    <div class="demo-toolbar"><span class="window-dots" aria-hidden="true">● ● ●</span><span>Google Images / with View Image</span><span aria-hidden="true">↗</span></div>
    <img src="assets/example.png" width="743" height="629" alt="Google Images preview showing the restored View image button next to Visit for a Doge image from Wikipedia" fetchpriority="high">
    <figcaption><span class="status-dot"></span> The button is back, right where you need it.</figcaption>
  </figure>
</section>
<div class="trust-strip"><span>Firefox + Chromium</span><span>MIT licensed</span><span>No analytics in the extension</span><a href="${repo}">Readable source code ${arrow}</a></div>
<section class="section intro" id="about">
  <p class="eyebrow">A familiar feature, kept working</p>
  <div class="split"><h2>Google changed.<br>View Image caught up.</h2><div><p>The original ViewImage extension restored a useful shortcut: opening an image directly from Google’s preview. As Google changed its result panels, the old implementation stopped finding the right controls.</p><p>This independent continuation, maintained by Kevin Elias, updates the detection for today’s panel variants, including <code>udm=imgs</code>. It identifies the selected image and its matching destination action, then keeps the button in sync as you browse results.</p><p>It continues <a href="https://github.com/bijij/ViewImage">Joshua Butt’s original project</a>. It is not an official Google product or an upstream release. Version ${version} restores direct image viewing; Google’s own Lens tools remain separate.</p></div></div>
</section>
<section class="section" id="features">
  <p class="eyebrow">Small extension. Useful details.</p>
  <div class="features">
    <article><span class="feature-number">01 / DIRECT</span><h3>Go to the image</h3><p>Open the full-size image URL when Google exposes it. A missing original is handled safely instead of linking to a Google thumbnail.</p></article>
    <article><span class="feature-number">02 / ADAPTIVE</span><h3>Keep browsing</h3><p>The button follows the selected result and supports detached preview panels. No duplicate buttons as the page updates.</p></article>
    <article><span class="feature-number">03 / YOUR CHOICE</span><h3>Make it yours</h3><p>Choose a new tab, hide the referrer, or set custom button text. Otherwise, the label follows your browser’s language.</p></article>
  </div>
</section>
<section class="section resources">
  <div><p class="eyebrow">Get started in a minute</p><h2>A guide for every step.</h2><p>Choose your browser, install the extension, reload Google Images, and open a result.</p></div>
  <div class="resource-list"><a href="install.html"><span><strong>Install View Image</strong><small>Signed Firefox package or Chromium ZIP</small></span>${arrow}</a><a href="troubleshooting.html"><span><strong>Button not showing?</strong><small>Page access, panel variants, and private browsing</small></span>${arrow}</a><a href="how-it-works.html"><span><strong>How it works</strong><small>Inside the current Google Images fix</small></span>${arrow}</a></div>
</section>
<section class="release-callout"><div><p class="eyebrow">Latest release / ${version}</p><h2>Ready for your browser.</h2><p>Current URL modes, detached panels, localized text, and a Mozilla-signed Firefox package.</p></div><a class="button primary" href="${release}">View release ${arrow}</a><a class="text-link" href="changelog.html">Read the changelog →</a></section>`;

const pages = [
    {
        file: 'index.html', title: 'View Image – Maintained Google Images Extension',
        description: 'A maintained View Image extension for the current Google Images interface. Restore direct image viewing on Firefox and Chromium. Free and open source.',
        content: home,
    },
    {
        file: 'install.html', title: 'Install View Image for Firefox and Chromium',
        description: 'Install the Mozilla-signed View Image Firefox extension or load the Chromium version in Chrome and Edge. Step-by-step desktop installation instructions.',
        content: `<article class="article"><p class="eyebrow">Getting started / version ${version}</p><h1>Install View Image.</h1><p class="lead">Choose your desktop browser. The Firefox package is signed by Mozilla; the Chromium package is installed as an unpacked extension.</p>
<section id="firefox"><h2>Firefox</h2><a class="button primary" href="${firefox}">Download signed Firefox XPI ${arrow}</a><ol><li>Download <code>ViewImage-${version}-firefox.xpi</code> from the official GitHub release.</li><li>If Firefox offers to install the extension, review the prompt. Otherwise, open <code>about:addons</code>, use the gear menu, and select <strong>Install Add-on From File…</strong>.</li><li>Select the downloaded XPI and follow Firefox’s confirmation.</li><li>Reload Google Images and select a result. The <strong>View image</strong> button appears beside the preview’s destination action.</li></ol><p>You do not need to disable Firefox’s signature checks. For private windows, explicitly allow the extension to run in private browsing in its Firefox settings.</p></section>
<section id="chromium"><h2>Chrome, Chromium, and Edge</h2><a class="button secondary" href="${chromium}">Download Chromium ZIP ${arrow}</a><ol><li>Download and extract <code>ViewImage-${version}-chromium.zip</code>. Keep the extracted folder in a permanent location.</li><li>Open <code>chrome://extensions</code> in Chrome/Chromium, or <code>edge://extensions</code> in Edge.</li><li>Enable <strong>Developer mode</strong>, choose <strong>Load unpacked</strong>, and select the folder containing <code>manifest.json</code>.</li><li>Reload Google Images and open a result preview.</li></ol><p>This fork has no Chrome Web Store listing. Unpacked installations need manual updates: download a newer release, replace the extracted files, and reload the extension on the extensions page.</p></section>
<section><h2>Options and updates</h2><p>Open the extension’s popup and choose Settings. You can customize the button text, whether the image opens in a new tab, and whether the link sends a referrer. The default label uses your browser’s interface language, not Google’s selected language.</p><p>Check <a href="${repo}/releases/latest">GitHub Releases</a> for updates. Firefox packages distributed this way should be updated manually from the signed XPI unless a supported automatic-update channel is established.</p><p>Desktop Firefox and Chromium are supported targets. Mobile browsers are not currently supported. If the button is missing, see <a href="troubleshooting.html">troubleshooting</a>.</p></section></article>`,
    },
    {
        file: 'troubleshooting.html', title: 'View Image Troubleshooting – Missing Button and Browser Access',
        description: 'Find out why the View Image button is missing in Google Images. Check browser access, private browsing, unsupported previews, and extension conflicts.',
        content: `<article class="article"><p class="eyebrow">Help / Google Images</p><h1>Find the missing button.</h1><p class="lead">Google serves different result layouts. Start with page access and the selected preview, then narrow down the cause.</p>
<section><h2>After installing or updating</h2><ol><li>Confirm that View Image is enabled in the browser’s extension manager.</li><li>Reload the Google Images tab. Pages already open before installation may not yet contain the content script.</li><li>Open the Images results tab and select an image. The button belongs to the expanded preview, not every thumbnail.</li><li>Check that the extension is allowed to run on your current Google domain. Browser site-access settings can prevent injection.</li></ol></section>
<section><h2>Works privately, but not in normal browsing?</h2><p>This does not by itself prove another extension is responsible. Google may serve different preview structures or URL modes to different sessions. Version ${version} supports <code>udm=imgs</code>, <code>udm=2</code>, <code>tbm=isch</code>, and <code>imgres</code>.</p><p>Compare the same search and selected result in both sessions. Check site access in the normal window, then temporarily disable other page-modifying extensions while leaving View Image enabled. If it still fails, report the specific panel variant. Firefox private browsing also requires explicit permission for this extension.</p></section>
<section><h2>The button is disabled or the image will not open</h2><p>If Google only exposes a thumbnail, the extension disables the link instead of pretending it found the original. Select another result or use Visit. A destination server can also reject direct image requests or require a session; View Image cannot override that server’s access rules.</p></section>
<section><h2>The text is in another language</h2><p>The extension uses the browser’s interface language. Google’s page language is independent. You can override the label in the extension’s settings with custom button text.</p></section>
<section><h2>Report a reproducible issue</h2><p>Include browser and extension versions, steps to reproduce, whether it occurs in a private window, and the URL mode. Add a screenshot or sanitized DOM example when useful. Remove private search terms, personal links, account information, cookies, and tokens.</p><a class="button secondary" href="${repo}/issues/new/choose">Report an issue ${arrow}</a><p>For security problems, use <a href="${repo}/security/advisories/new">private vulnerability reporting</a>.</p></section></article>`,
    },
    {
        file: 'privacy.html', title: 'View Image Privacy – Permissions and Local Preferences',
        description: 'Understand View Image permissions, preference synchronization, referrer controls, and what happens when you open an original image.',
        content: `<article class="article"><p class="eyebrow">Privacy / plain language</p><h1>Your images.<br>Your browser.</h1><p class="lead">The extension does not include analytics, advertising, telemetry, or a service that collects your searches or images.</p>
<section><h2>What the extension reads</h2><p>A content script runs on supported Google pages and checks whether the URL represents an Images result. It reads the selected preview, image URLs, and destination links in the page’s DOM to create the View image link. This processing happens in your browser.</p><p>The extension does not send those page details to a maintainer-controlled server. Opening an image follows its original URL, so your browser makes a normal request to that image’s host.</p></section>
<section><h2>Permissions and preferences</h2><p>The only requested API permission is <code>storage</code>. Content-script URL matches separately determine the Google pages the extension can access. Preferences such as custom button text and new-tab behavior are stored using <code>chrome.storage.sync</code>.</p><p>If browser synchronization is enabled, Firefox or Chromium may synchronize these preferences through the browser account. This is managed by the browser; it is not the extension’s own data-collection service.</p></section>
<section><h2>Referrer controls</h2><p>The generated link removes copied Google event and tracking attributes. In Settings, enable the option to hide the referrer if you want the link to use <code>noreferrer</code>. This option is not enabled by default. The image host still receives a normal network request, including information your browser normally sends.</p></section>
<section><h2>This website and downloads</h2><p>This website has no analytics scripts, external fonts, or advertising. It is hosted on GitHub Pages; GitHub processes normal hosting and download requests under its <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">privacy statement</a>. Downloads are served by GitHub Releases.</p></section>
<section><h2>Verify the code</h2><p>The source is public and MIT licensed. Review <a href="${repo}/blob/master/js/content-script.js">the content script</a>, <a href="${repo}/blob/master/js/view-image-core.js">panel detection</a>, and <a href="${repo}/blob/master/js/options.js">preferences code</a>. For questions, <a href="${repo}/issues">open an issue</a> without sharing private browsing information.</p></section></article>`,
    },
    {
        file: 'how-it-works.html', title: 'How View Image Works with Current Google Images Panels',
        description: 'Learn how this maintained ViewImage extension detects Google Images previews, resolves original image URLs, and updates the restored button.',
        content: `<article class="article"><p class="eyebrow">Under the hood / readable code</p><h1>A small fix,<br>built to adapt.</h1><p class="lead">The maintained implementation follows the relationships in Google’s preview panel instead of assuming a particular obfuscated CSS class will stay the same.</p>
<section><h2>1. Recognize an Images page</h2><p>The content script is declared for Google pages, then gates its behavior using <code>isSupportedImagesURL</code>. This supports current <code>udm=imgs</code> and <code>udm=2</code> searches alongside legacy <code>tbm=isch</code> and image-result URLs. A Google page without an Images mode does not receive the button.</p></section>
<section><h2>2. Identify the selected preview</h2><p><code>view-image-core.js</code> examines visible images and links to identify the active result and its destination action. It supports a panel variant where the main image is separate from the title and visit links. Original-image candidates are validated so a Google thumbnail is not used as the final link.</p></section>
<section><h2>3. Add a clean View image link</h2><p>The extension adapts the destination button’s presentation, removes Google event handlers and tracking attributes from the copy, sets the direct image URL, and applies your new-tab and referrer choices. The text comes from the browser’s localization API or your custom label.</p></section>
<section><h2>4. Stay in sync</h2><p>A MutationObserver schedules updates when Google replaces the preview or changes relevant attributes. A signature for the selected result and settings avoids unnecessary button replacement. Stale buttons are removed when the preview closes or changes.</p></section>
<section><h2>Limits and regression checks</h2><p>Google changes its layout independently, and an unavailable full-size URL cannot be reconstructed reliably from a thumbnail alone. DOM fixtures test current and detached panels, localized text, result changes, duplicate prevention, and missing originals. Real-browser testing remains necessary for new variants.</p><a class="button secondary" href="${repo}/tree/master/test">Explore the tests ${arrow}</a></section></article>`,
    },
    {
        file: 'changelog.html', title: 'View Image Changelog – Maintained Firefox and Chromium Releases',
        description: 'Read the changes in the maintained View Image 5.3.4 release: current Google Images URL support, detached panels, and a Mozilla-signed Firefox package.',
        content: `<article class="article"><p class="eyebrow">Release history</p><h1>Kept working.</h1><p class="lead">Changes in the maintained continuation of ViewImage.</p><section><div class="release-heading"><h2>5.3.4</h2><span class="tag">Current release</span></div><p>Released September 18, 2026.</p><ul><li>Support for <code>udm=imgs</code>, <code>udm=2</code>, <code>tbm=isch</code>, and <code>imgres</code> URL modes.</li><li>Support for detached main-image preview panels.</li><li>Semantic detection of the selected image and destination action.</li><li>More reliable Google-page injection and Images-mode checks in the content script.</li><li>Updated popup attribution and maintained repository links.</li><li>Unique Firefox ID: <code>viewimage-fork@kevinjhampier.github.io</code>.</li><li>Mozilla-signed Firefox XPI and Chromium ZIP distribution.</li><li>12 automated tests, ESLint, and clean Firefox manifest validation.</li></ul><p><a href="${release}">Release notes and downloads ${arrow}</a></p></section><section><h2>Project presentation</h2><p>October 1, 2026: added this website, installation and troubleshooting guides, privacy documentation, sharing metadata, and contribution guidelines. These documentation changes do not alter the signed 5.3.4 extension.</p></section><section><h2>Earlier releases and upstream</h2><p>See <a href="${repo}/releases">all fork releases</a> for prior packages. The original project’s history is available at <a href="https://github.com/bijij/ViewImage">bijij/ViewImage</a>.</p></section></article>`,
    },
];

const application = {
    '@context': 'https://schema.org', '@type': ['SoftwareApplication', 'BrowserApplication'],
    name: 'View Image', url: site, description: pages[0].description,
    applicationCategory: 'UtilitiesApplication', softwareVersion: version,
    operatingSystem: 'Windows, macOS, Linux', browserRequirements: 'Desktop Firefox or Chromium-based browser',
    isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: 'Joshua Butt' },
    maintainer: { '@type': 'Person', name: 'Kevin Elias' },
    license: `${repo}/blob/master/LICENSE`,
    subjectOf: { '@type': 'SoftwareSourceCode', codeRepository: repo, programmingLanguage: 'JavaScript' },
    downloadUrl: firefox, screenshot: `${site}assets/example.png`, image: `${site}assets/social-preview.png`,
};

for (const page of pages) {
    const isHome = page.file === 'index.html';
    const canonical = isHome ? site : `${site}${page.file}`;
    const document = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHTML(page.title)}</title>
  <meta name="description" content="${escapeHTML(page.description)}">
  <meta name="theme-color" content="#f5f4ec">
  <link rel="canonical" href="${canonical}">
  <link rel="icon" href="assets/icon.png" type="image/png">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="sitemap" type="application/xml" href="${site}sitemap.xml">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="View Image">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="${escapeHTML(page.title)}">
  <meta property="og:description" content="${escapeHTML(page.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${site}assets/social-preview.png">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="640">
  <meta property="og:image:alt" content="View Image: one click to the actual image. A maintained extension for Firefox and Chromium.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHTML(page.title)}">
  <meta name="twitter:description" content="${escapeHTML(page.description)}">
  <meta name="twitter:image" content="${site}assets/social-preview.png">
  ${isHome && verification ? `<meta name="google-site-verification" content="${escapeHTML(verification)}">` : ''}
  ${isHome ? `<script type="application/ld+json">${JSON.stringify(application, null, 2)}</script>` : ''}
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header"><a class="brand" href="./"><img src="assets/icon.png" width="32" height="32" alt="">View Image<span class="brand-note">/ maintained</span></a><nav aria-label="Main navigation"><a href="install.html"${page.file === 'install.html' ? ' aria-current="page"' : ''}>Install</a><a href="how-it-works.html"${page.file === 'how-it-works.html' ? ' aria-current="page"' : ''}>How it works</a><a href="troubleshooting.html"${page.file === 'troubleshooting.html' ? ' aria-current="page"' : ''}>Help</a><a class="github-link" href="${repo}">GitHub ${arrow}</a></nav></header>
  <main id="main">${page.content}</main>
  <footer class="site-footer"><div><a class="brand" href="./">View Image</a><p>A useful button, maintained by Kevin Elias.<br>Continuing Joshua Butt’s ViewImage · <a href="${repo}/blob/master/LICENSE">MIT license</a></p></div><nav aria-label="Footer navigation"><a href="privacy.html">Privacy</a><a href="changelog.html">Changelog</a><a href="${repo}/blob/master/CONTRIBUTING.md">Contribute</a><a href="${repo}">Source code ${arrow}</a></nav><p class="disclaimer">Independent project. Not affiliated with Google or Mozilla. Third-party screenshot content belongs to its respective owners.</p></footer>
</body>
</html>
`;
    writeFileSync(path.join(docs, page.file), document, 'utf8');
}

writeFileSync(path.join(docs, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${page.file === 'index.html' ? site : `${site}${page.file}`}</loc></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(path.join(docs, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`);
writeFileSync(path.join(docs, '.nojekyll'), '');
console.log(`Built ${pages.length} static pages and sitemap in ${docs}`);
