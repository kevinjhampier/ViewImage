'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const manifest = JSON.parse(readFileSync(
    path.join(__dirname, '..', 'manifest.base.json'),
    'utf8',
));

test('identifies the maintained functional fork in extension metadata', () => {
    assert.match(manifest.description, /functional fork/i);
    assert.equal(manifest.author, 'Joshua Butt (fork mantenido por Kevin Elias)');
    assert.equal(manifest.homepage_url, 'https://github.com/kevinjhampier/ViewImage');
});

test('injects diagnostics on Google pages before applying the Images URL gate in code', () => {
    assert.equal(manifest.permissions.includes('activeTab'), true);
    assert.equal('include_globs' in manifest.content_scripts[0], false);
    assert.match(manifest.content_scripts[0].matches[0], /google/);
});
