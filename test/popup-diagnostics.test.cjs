'use strict';

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { JSDOM } = require('jsdom');

const projectRoot = path.join(__dirname, '..');
const popupHTML = readFileSync(path.join(projectRoot, 'html', 'popup.html'), 'utf8');
const popupScript = readFileSync(path.join(projectRoot, 'js', 'popup.js'), 'utf8');

function createPopup(response, runtimeError) {
    const dom = new JSDOM(popupHTML, {
        runScripts: 'outside-only',
        url: 'moz-extension://view-image/html/popup.html',
    });

    dom.window.chrome = {
        i18n: {
            getMessage() {
                return '';
            },
        },
        runtime: {
            getManifest() {
                return { version: '5.3.3' };
            },
            getPlatformInfo(callback) {
                callback({ nacl_arch: 'x86-64', os: 'win' });
            },
            id: '{test-extension}',
            lastError: null,
            openOptionsPage() {},
        },
        tabs: {
            query(query, callback) {
                callback([{
                    id: 42,
                    title: 'Google Images result',
                    url: 'https://www.google.com/search?q=test&udm=2',
                }]);
            },
            sendMessage(tabId, message, callback) {
                dom.window.chrome.runtime.lastError = runtimeError ? { message: runtimeError } : null;
                callback(response);
            },
        },
    };

    dom.window.eval(popupScript);
    return dom.window.document;
}

test('renders a downloadable text diagnostic returned by the content script', () => {
    const document = createPopup({
        ok: true,
        report: {
            core: { detection: { strategy: 'detached-panel' } },
            generatedAt: '2026-09-17T00:00:00.000Z',
        },
    });

    document.querySelector('#generate-diagnostics').click();

    const output = document.querySelector('#diagnostic-output');
    assert.match(output.value, /VIEW IMAGE DIAGNOSTIC REPORT/);
    assert.match(output.value, /"strategy": "detached-panel"/);
    assert.equal(output.classList.contains('has-report'), true);
    assert.equal(document.querySelector('#download-diagnostics').disabled, false);
});

test('produces an exportable error report when the content script is unreachable', () => {
    const document = createPopup(undefined, 'Could not establish connection. Receiving end does not exist.');

    document.querySelector('#generate-diagnostics').click();

    const output = document.querySelector('#diagnostic-output');
    assert.match(output.value, /"status": "content-script-unreachable"/);
    assert.match(output.value, /Could not establish connection/);
    assert.match(output.value, /https:\/\/www\.google\.com\/search\?q=test&udm=2/);
    assert.equal(document.querySelector('#download-diagnostics').disabled, false);
});
