import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = path.join(root, 'docs');
const site = 'https://kevinjhampier.github.io/ViewImage/';
const pages = readdirSync(docs).filter(file => file.endsWith('.html') && !/^google[a-f0-9]+\.html$/.test(file));
const titles = new Set();
const descriptions = new Set();
let links = 0;

for (const file of pages) {
    const dom = new JSDOM(readFileSync(path.join(docs, file), 'utf8'));
    const document = dom.window.document;
    assert.equal(document.documentElement.lang, 'en', file);
    assert.equal(document.querySelectorAll('h1').length, 1, file);
    assert.ok(document.title.length > 15, file);
    assert.ok(!titles.has(document.title), `Duplicate title: ${file}`);
    titles.add(document.title);
    const description = document.querySelector('meta[name="description"]').content;
    assert.ok(description.length > 50, file);
    assert.ok(!descriptions.has(description), `Duplicate description: ${file}`);
    descriptions.add(description);
    const canonical = file === 'index.html' ? site : `${site}${file}`;
    assert.equal(document.querySelector('link[rel="canonical"]').href, canonical);
    assert.equal(document.querySelector('meta[property="og:url"]').content, canonical);
    assert.equal(document.querySelector('meta[property="og:image"]').content, `${site}assets/social-preview.png`);
    assert.ok(document.querySelector('meta[name="viewport"]'));

    for (const element of document.querySelectorAll('[href], [src]')) {
        const target = element.getAttribute('href') || element.getAttribute('src');
        if (/^[a-z]+:/i.test(target) || target.startsWith('//')) {
            continue;
        }
        const [pathname, hash] = target.split('#');
        const targetPath = path.join(docs, pathname === './' ? 'index.html' : pathname || file);
        assert.ok(existsSync(targetPath), `${file}: missing ${target}`);
        if (hash) {
            const targetDOM = new JSDOM(readFileSync(targetPath, 'utf8'));
            assert.ok(targetDOM.window.document.getElementById(hash), `${file}: missing anchor ${target}`);
            targetDOM.window.close();
        }
        links++;
    }
    for (const img of document.querySelectorAll('img')) {
        assert.ok(img.hasAttribute('alt'), `Image missing alt: ${file}`);
    }
    dom.window.close();
}

const home = new JSDOM(readFileSync(path.join(docs, 'index.html'), 'utf8'));
const application = JSON.parse(home.window.document.querySelector('script[type="application/ld+json"]').textContent);
const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.base.json'), 'utf8'));
assert.equal(application.softwareVersion, manifest.version);
assert.equal(application.offers.price, '0');
assert.equal(application.url, site);
assert.ok(application['@type'].includes('SoftwareApplication'));
assert.ok(application['@type'].includes('BrowserApplication'));
assert.equal(application.aggregateRating, undefined);
home.window.close();
const sitemap = new JSDOM(readFileSync(path.join(docs, 'sitemap.xml'), 'utf8'), { contentType: 'text/xml' });
const locations = [...sitemap.window.document.querySelectorAll('loc')].map(node => node.textContent);
assert.equal(locations.length, pages.length);
for (const file of pages) {
    assert.ok(locations.includes(file === 'index.html' ? site : `${site}${file}`));
}
sitemap.window.close();
const preview = readFileSync(path.join(docs, 'assets/social-preview.png'));
assert.equal(preview.readUInt32BE(16), 1280);
assert.equal(preview.readUInt32BE(20), 640);
assert.ok(preview.length < 1024 * 1024);
console.log(`Checked ${pages.length} pages, ${links} local references, sitemap, JSON-LD, and 1280x640 sharing image.`);
