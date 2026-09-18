'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const popupHTML = readFileSync(path.join(__dirname, '..', 'html', 'popup.html'), 'utf8');

test('credits the fork maintainer and links to the fork repository', () => {
    const document = new JSDOM(popupHTML).window.document;
    const repositoryLink = document.querySelector('a[href="https://github.com/kevinjhampier/ViewImage"]');

    assert.ok(repositoryLink);
    assert.match(document.body.textContent, /Functional fork by Kevin Elias/);
    assert.equal(document.querySelector('#generate-diagnostics'), null);
});
