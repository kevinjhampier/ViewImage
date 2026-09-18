'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { JSDOM } = require('jsdom');
const core = require('../js/view-image-core.js');

const SOURCE_URL = 'https://images.example/full-size-page';
const IMAGE_URL = 'https://cdn.example/images/full-size.jpg';
const THUMBNAIL_URL = 'https://encrypted-tbn0.gstatic.com/images?q=thumbnail';
const OPTIONS = {
    'open-in-new-tab': true,
    'no-referrer': true,
};

function createFixture({ originalImage = true } = {}) {
    const original = originalImage ? `<img id="original" src="${IMAGE_URL}" alt="Result">` : '';
    const dom = new JSDOM(`<!doctype html>
        <html>
            <body>
                <main id="result-panel">
                    <div class="media">
                        <a id="image-link" href="${SOURCE_URL}">
                            ${original}
                            <img id="thumbnail" src="${THUMBNAIL_URL}" alt="Result placeholder">
                        </a>
                    </div>
                    <div class="details">
                        <a class="publisher" href="${SOURCE_URL}"><div>Example publisher</div></a>
                        <a class="title" href="${SOURCE_URL}"><h1>Example title</h1></a>
                        <a id="visit" href="${SOURCE_URL}" target="_blank" rel="noopener"
                           jsaction="google.handler" ping="/tracking">
                            <div aria-label="Go">
                                <span>Go</span>
                                <svg viewBox="0 0 24 24"></svg>
                            </div>
                        </a>
                    </div>
                </main>
            </body>
        </html>`, {
        url: 'https://www.google.com/search?q=test&udm=2',
    });

    return dom.window.document;
}

function createDetachedPanelFixture() {
    const dom = new JSDOM(`<!doctype html>
        <html>
            <body>
                <main id="detached-result-panel">
                    <div class="media">
                        <img id="detached-original" src="${IMAGE_URL}" alt="Result">
                    </div>
                    <div class="details" data-title-id="ucc-6">
                        <a class="title" href="${SOURCE_URL}" target="_blank" rel="noopener">
                            <h1 id="ucc-6">Example title</h1>
                        </a>
                        <a id="detached-visit" href="${SOURCE_URL}" target="_blank" rel="noopener"
                           aria-describedby="ucc-6" data-sb="/url?source=web">
                            <div aria-label="Visit">
                                <span>Visit</span>
                                <svg viewBox="0 0 24 24"></svg>
                            </div>
                        </a>
                    </div>
                </main>
            </body>
        </html>`, {
        url: 'https://www.google.com/search?q=test&udm=2',
    });

    const image = dom.window.document.querySelector('#detached-original');
    image.getBoundingClientRect = () => ({
        bottom: 640,
        height: 600,
        left: 40,
        right: 840,
        top: 40,
        width: 800,
    });

    return dom.window.document;
}

function visible() {
    return true;
}

test('recognizes current and legacy Google Images URL modes', () => {
    assert.equal(core.isSupportedImagesURL('https://www.google.com/search?q=test&udm=imgs'), true);
    assert.equal(core.isSupportedImagesURL('https://www.google.com/search?q=test&udm=2'), true);
    assert.equal(core.isSupportedImagesURL('https://www.google.com/search?q=test&tbm=isch'), true);
    assert.equal(core.isSupportedImagesURL('https://www.google.com/imgres?imgurl=https://example.com/a.jpg'), true);
    assert.equal(core.isSupportedImagesURL('https://www.google.com/search?q=test'), false);
    assert.equal(core.isSupportedImagesURL('not a URL'), false);
});

test('finds the active result semantically and prefers the original image URL', () => {
    const document = createFixture();
    const result = core.findActiveResult(document, visible);

    assert.ok(result);
    assert.equal(result.visitButton.id, 'visit');
    assert.equal(result.imageURL, IMAGE_URL);
});

test('adds a clean, localized and privacy-aware View image button', () => {
    const document = createFixture();
    const result = core.syncViewImageButton(document, OPTIONS, 'Ver imagen', visible);
    const button = result.button;

    assert.equal(result.state, 'added');
    assert.equal(button.href, IMAGE_URL);
    assert.equal(button.textContent.trim(), 'Ver imagen');
    assert.equal(button.getAttribute('target'), '_blank');
    assert.match(button.getAttribute('rel'), /noopener/);
    assert.match(button.getAttribute('rel'), /noreferrer/);
    assert.equal(button.hasAttribute('jsaction'), false);
    assert.equal(button.hasAttribute('ping'), false);
    assert.equal(button.nextElementSibling.id, 'visit');
});

test('supports the Google panel variant whose main image is detached from the source links', () => {
    const document = createDetachedPanelFixture();
    const detected = core.findActiveResult(document, visible);

    assert.ok(detected);
    assert.equal(detected.visitButton.id, 'detached-visit');
    assert.equal(detected.image.id, 'detached-original');
    assert.equal(detected.imageURL, IMAGE_URL);

    const result = core.syncViewImageButton(document, OPTIONS, 'Ver imagen', visible);
    assert.equal(result.state, 'added');
    assert.equal(result.button.href, IMAGE_URL);
    assert.equal(result.button.nextElementSibling.id, 'detached-visit');
});

test('is idempotent when Google emits unrelated mutations', () => {
    const document = createFixture();
    const first = core.syncViewImageButton(document, OPTIONS, 'View image', visible);
    const second = core.syncViewImageButton(document, OPTIONS, 'View image', visible);

    assert.equal(first.state, 'added');
    assert.equal(second.state, 'unchanged');
    assert.equal(document.querySelectorAll('.vi_ext_addon').length, 1);
    assert.equal(first.button, second.button);
});

test('creates a disabled button without throwing when only a Google thumbnail exists', () => {
    const document = createFixture({ originalImage: false });
    const result = core.syncViewImageButton(document, OPTIONS, 'View image', visible);

    assert.equal(result.state, 'added');
    assert.equal(result.imageURL, undefined);
    assert.equal(result.button.hasAttribute('href'), false);
    assert.equal(result.button.getAttribute('aria-disabled'), 'true');
});

test('updates the button when the selected result changes', () => {
    const document = createFixture();
    core.syncViewImageButton(document, OPTIONS, 'View image', visible);

    const image = document.querySelector('#original');
    image.setAttribute('src', 'https://cdn.example/images/second.jpg');
    const result = core.syncViewImageButton(document, OPTIONS, 'View image', visible);

    assert.equal(result.state, 'added');
    assert.equal(result.button.href, 'https://cdn.example/images/second.jpg');
    assert.equal(document.querySelectorAll('.vi_ext_addon').length, 1);
});

test('removes a stale extension button when no result panel is active', () => {
    const document = createFixture();
    core.syncViewImageButton(document, OPTIONS, 'View image', visible);
    document.querySelector('#visit').remove();

    const result = core.syncViewImageButton(document, OPTIONS, 'View image', visible);

    assert.equal(result.state, 'not-found');
    assert.equal(document.querySelector('.vi_ext_addon'), null);
});
