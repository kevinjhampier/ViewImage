'use strict';

(function (root, factory) {
    const api = factory();

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }

    root.ViewImageCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const EXTENSION_CLASS = 'vi_ext_addon';
    const THUMBNAIL_HOST = /(^|\.)encrypted-tbn\d*\.gstatic\.com$/i;

    function getWindow(element) {
        return element?.ownerDocument?.defaultView;
    }

    function isElementVisible(element) {
        if (!element?.isConnected) {
            return false;
        }

        const win = getWindow(element);
        const style = win?.getComputedStyle?.(element);

        if (style && (style.display === 'none' || style.visibility === 'hidden')) {
            return false;
        }

        if (element.closest('[aria-hidden="true"]')) {
            return false;
        }

        const rect = element.getBoundingClientRect();
        const viewportWidth = win?.innerWidth || element.ownerDocument.documentElement.clientWidth;
        const viewportHeight = win?.innerHeight || element.ownerDocument.documentElement.clientHeight;

        return rect.width > 0 &&
            rect.height > 0 &&
            rect.bottom > 0 &&
            rect.right > 0 &&
            rect.top < viewportHeight &&
            rect.left < viewportWidth;
    }

    function normalizeURL(value, baseURI) {
        try {
            const url = new URL(value, baseURI);
            url.hash = '';
            return url.href;
        } catch {
            return value || '';
        }
    }

    function isGoogleThumbnail(value, baseURI) {
        try {
            return THUMBNAIL_HOST.test(new URL(value, baseURI).hostname);
        } catch {
            return false;
        }
    }

    function sourceScore(source, image) {
        if (!source) {
            return Number.NEGATIVE_INFINITY;
        }

        if (source.startsWith('data:image/')) {
            return 20;
        }

        if (!/^(https?:|blob:)/i.test(source)) {
            return Number.NEGATIVE_INFINITY;
        }

        let score = 100;
        if (isGoogleThumbnail(source, image.ownerDocument.baseURI)) {
            score -= 1000;
        }

        score += Math.min((image.naturalWidth || 0) * (image.naturalHeight || 0), 10000000) / 100000;
        return score;
    }

    function getBestImageURL(imageLink, preferredImage) {
        const images = [preferredImage, ...imageLink.querySelectorAll('img')]
            .filter((image, index, array) => image && array.indexOf(image) === index);
        const candidates = [];

        for (const image of images) {
            const sources = [image.currentSrc, image.getAttribute('src')];
            for (const source of sources) {
                if (!source || candidates.some(candidate => candidate.source === source)) {
                    continue;
                }

                candidates.push({ source, score: sourceScore(source, image) });
            }
        }

        candidates.sort((left, right) => right.score - left.score);
        const best = candidates[0];

        if (best && Number.isFinite(best.score) && best.score >= 0) {
            return best.source;
        }

        const pageURL = new URL(imageLink.ownerDocument.location.href);
        return pageURL.searchParams.get('imgurl') || undefined;
    }

    function isActionLink(anchor) {
        return Boolean(
            anchor.querySelector('svg') ||
            anchor.querySelector('button, [role="button"], div[aria-label]')
        );
    }

    function findActionLink(container, imageLink, visibilityPredicate) {
        const expectedURL = normalizeURL(imageLink.href, imageLink.ownerDocument.baseURI);
        const candidates = [...container.querySelectorAll('a[href]')]
            .filter(anchor => anchor !== imageLink)
            .filter(anchor => !anchor.classList.contains(EXTENSION_CLASS))
            .filter(anchor => normalizeURL(anchor.href, anchor.ownerDocument.baseURI) === expectedURL)
            .filter(anchor => !anchor.querySelector('img'))
            .filter(anchor => visibilityPredicate(anchor))
            .filter(isActionLink);

        candidates.sort((left, right) => {
            const leftScore = (left.querySelector('svg') ? 10 : 0) + (left.querySelector('span') ? 5 : 0);
            const rightScore = (right.querySelector('svg') ? 10 : 0) + (right.querySelector('span') ? 5 : 0);
            return rightScore - leftScore;
        });

        return candidates[0];
    }

    function imageArea(image) {
        const rect = image.getBoundingClientRect();
        return rect.width * rect.height;
    }

    function findActiveResult(root, visibilityPredicate = isElementVisible) {
        const images = [...root.querySelectorAll('img[src], img[srcset]')]
            .filter(image => !image.closest(`.${EXTENSION_CLASS}`))
            .filter(visibilityPredicate)
            .sort((left, right) => imageArea(right) - imageArea(left));

        for (const image of images) {
            const imageLink = image.closest('a[href]');
            if (!imageLink) {
                continue;
            }

            let container = imageLink.parentElement;
            for (let depth = 0; container && depth < 10; depth += 1, container = container.parentElement) {
                const visitButton = findActionLink(container, imageLink, visibilityPredicate);
                if (!visitButton) {
                    continue;
                }

                return {
                    container,
                    image,
                    imageLink,
                    imageURL: getBestImageURL(imageLink, image),
                    visitButton,
                };
            }
        }

        return undefined;
    }

    function removeGoogleHandlers(element) {
        const attributes = [
            'aria-describedby',
            'data-hveid',
            'data-ved',
            'id',
            'jsaction',
            'jscontroller',
            'jsname',
            'ping',
        ];

        for (const node of [element, ...element.querySelectorAll('*')]) {
            for (const attribute of attributes) {
                node.removeAttribute(attribute);
            }
        }
    }

    function setButtonText(button, text) {
        const textElement = [...button.querySelectorAll('span')]
            .find(element => element.textContent.trim()) || button.querySelector('span');

        if (textElement) {
            textElement.textContent = text;
        } else {
            const span = button.ownerDocument.createElement('span');
            span.textContent = text;
            const icon = button.querySelector('svg');
            (icon?.parentElement || button).insertBefore(span, icon || null);
        }

        button.setAttribute('aria-label', text);
        for (const labelledElement of button.querySelectorAll('[aria-label]')) {
            labelledElement.setAttribute('aria-label', text);
        }
    }

    function createViewImageButton(result, options, buttonText) {
        const button = result.visitButton.cloneNode(true);
        button.classList.add(EXTENSION_CLASS);
        removeGoogleHandlers(button);
        setButtonText(button, buttonText);

        const imageURL = result.imageURL;
        button.dataset.viImageUrl = imageURL || '';
        button.dataset.viSignature = JSON.stringify({
            imageURL: imageURL || '',
            newTab: Boolean(options['open-in-new-tab']),
            noReferrer: Boolean(options['no-referrer']),
            text: buttonText,
        });

        if (imageURL) {
            button.href = imageURL;
            button.removeAttribute('aria-disabled');
            button.removeAttribute('title');
            button.style.removeProperty('pointer-events');

            if (imageURL.startsWith('data:image/')) {
                button.setAttribute('download', '');
            } else {
                button.removeAttribute('download');
            }
        } else {
            button.removeAttribute('href');
            button.setAttribute('aria-disabled', 'true');
            button.setAttribute('title', 'No full-sized image was found.');
            button.style.setProperty('pointer-events', 'none');
            button.tabIndex = -1;
        }

        if (options['open-in-new-tab']) {
            button.setAttribute('target', '_blank');
        } else {
            button.removeAttribute('target');
        }

        const rel = new Set((button.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        if (options['open-in-new-tab']) {
            rel.add('noopener');
        }
        if (options['no-referrer']) {
            rel.add('noreferrer');
        } else {
            rel.delete('noreferrer');
        }

        if (rel.size) {
            button.setAttribute('rel', [...rel].join(' '));
        } else {
            button.removeAttribute('rel');
        }

        return button;
    }

    function removeExistingButtons(root, except) {
        for (const button of root.querySelectorAll(`.${EXTENSION_CLASS}`)) {
            if (button !== except) {
                button.remove();
            }
        }
    }

    function syncViewImageButton(root, options, buttonText, visibilityPredicate = isElementVisible) {
        const result = findActiveResult(root, visibilityPredicate);
        if (!result) {
            removeExistingButtons(root);
            return { state: 'not-found' };
        }

        const signature = JSON.stringify({
            imageURL: result.imageURL || '',
            newTab: Boolean(options['open-in-new-tab']),
            noReferrer: Boolean(options['no-referrer']),
            text: buttonText,
        });
        const existing = result.visitButton.parentElement.querySelector(`.${EXTENSION_CLASS}`);

        if (existing?.dataset.viSignature === signature) {
            removeExistingButtons(root, existing);
            return { button: existing, imageURL: result.imageURL, state: 'unchanged' };
        }

        const button = createViewImageButton(result, options, buttonText);
        removeExistingButtons(root);
        result.visitButton.parentElement.insertBefore(button, result.visitButton);

        return { button, imageURL: result.imageURL, state: 'added' };
    }

    return Object.freeze({
        EXTENSION_CLASS,
        createViewImageButton,
        findActiveResult,
        getBestImageURL,
        isElementVisible,
        isGoogleThumbnail,
        syncViewImageButton,
    });
}));
