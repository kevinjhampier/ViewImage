'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const manifest = JSON.parse(readFileSync(
    path.join(__dirname, '..', 'manifest.base.json'),
    'utf8',
));
const firefoxManifest = JSON.parse(readFileSync(
    path.join(__dirname, '..', 'manifest.gecko.json'),
    'utf8',
));

test('identifies the maintained functional fork in extension metadata', () => {
    assert.match(manifest.description, /functional fork/i);
    assert.equal(manifest.author, 'Joshua Butt (fork mantenido por Kevin Elias)');
    assert.equal(manifest.homepage_url, 'https://github.com/kevinjhampier/ViewImage');
});

test('injects on Google pages and applies the Images URL gate in code', () => {
    assert.deepEqual(manifest.permissions, ['storage']);
    assert.equal('include_globs' in manifest.content_scripts[0], false);
    assert.match(manifest.content_scripts[0].matches[0], /google/);
});

test('uses a unique Firefox add-on ID for the maintained fork', () => {
    const addonId = firefoxManifest.browser_specific_settings.gecko.id;

    assert.equal(addonId, 'viewimage-fork@kevinjhampier.github.io');
    assert.notEqual(addonId, '{287dcf75-bec6-4eec-b4f6-71948a2eea29}');
    assert.match(addonId, /^[a-zA-Z0-9-._]*@[a-zA-Z0-9-._]+$/);
});
