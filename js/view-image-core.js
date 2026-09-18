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

    function isSupportedImagesURL(value) {
        try {
            const url = new URL(value);
            const udm = url.searchParams.get('udm');
            return url.pathname === '/imgres' ||
                url.searchParams.get('tbm') === 'isch' ||
                udm === '2' ||
                udm === 'imgs' ||
                url.searchParams.has('imgurl');
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

    function hasMatchingHeadingLink(actionLink) {
        const expectedURL = normalizeURL(actionLink.href, actionLink.ownerDocument.baseURI);
        let container = actionLink.parentElement;

        for (let depth = 0; container && depth < 4; depth += 1, container = container.parentElement) {
            const headingLink = [...container.querySelectorAll('a[href]')]
                .filter(anchor => anchor !== actionLink)
                .find(anchor =>
                    normalizeURL(anchor.href, anchor.ownerDocument.baseURI) === expectedURL &&
                    anchor.querySelector('h1, h2, h3, [role="heading"]')
                );

            if (headingLink) {
                return true;
            }
        }

        return false;
    }

    function findDetachedImage(actionLink, visibilityPredicate) {
        let container = actionLink.parentElement;
        let fallback;

        for (let depth = 0; container && depth < 12; depth += 1, container = container.parentElement) {
            const candidates = [...container.querySelectorAll('img[src], img[srcset]')]
                .filter(image => !image.closest(`.${EXTENSION_CLASS}`))
                .filter(visibilityPredicate)
                .map(image => ({
                    image,
                    imageURL: getBestImageURL(actionLink, image),
                    area: imageArea(image),
                }))
                .filter(candidate => candidate.imageURL)
                .sort((left, right) => right.area - left.area);

            if (!candidates.length) {
                continue;
            }

            if (!fallback) {
                fallback = { ...candidates[0], container };
            }
            const largeImage = candidates.find(candidate => candidate.area >= 4096);
            if (largeImage) {
                return { ...largeImage, container };
            }
        }

        return fallback;
    }

    function findDetachedResult(root, visibilityPredicate) {
        const actionLinks = [...root.querySelectorAll('a[href]')]
            .filter(anchor => !anchor.classList.contains(EXTENSION_CLASS))
            .filter(anchor => !anchor.querySelector('img'))
            .filter(visibilityPredicate)
            .filter(isActionLink)
            .filter(hasMatchingHeadingLink);

        for (const visitButton of actionLinks) {
            const detachedImage = findDetachedImage(visitButton, visibilityPredicate);
            if (!detachedImage) {
                continue;
            }

            return {
                container: detachedImage.container,
                image: detachedImage.image,
                imageLink: detachedImage.image.closest('a[href]') || visitButton,
                imageURL: detachedImage.imageURL,
                strategy: 'detached-panel',
                visitButton,
            };
        }

        return undefined;
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
                    strategy: 'linked-image',
                    visitButton,
                };
            }
        }

        return findDetachedResult(root, visibilityPredicate);
    }

    function truncate(value, maximumLength = 1000) {
        const text = String(value || '');
        return text.length > maximumLength ? `${text.slice(0, maximumLength)}…` : text;
    }

    function describeElement(element) {
        if (!element) {
            return undefined;
        }

        const classes = [...element.classList].slice(0, 5).map(className => `.${className}`).join('');
        const id = element.id ? `#${element.id}` : '';
        return `${element.localName}${id}${classes}`;
    }

    function describeAncestors(element, maximumDepth = 8) {
        const ancestors = [];
        let current = element;

        for (let depth = 0; current && depth < maximumDepth; depth += 1, current = current.parentElement) {
            ancestors.push(describeElement(current));
        }

        return ancestors;
    }

    function countLinkedActionMatches(imageLink, visibilityPredicate) {
        const expectedURL = normalizeURL(imageLink.href, imageLink.ownerDocument.baseURI);
        let container = imageLink.parentElement;
        const matches = new Set();

        for (let depth = 0; container && depth < 10; depth += 1, container = container.parentElement) {
            for (const anchor of [...container.querySelectorAll('a[href]')]
                .filter(anchor => anchor !== imageLink)
                .filter(anchor => !anchor.classList.contains(EXTENSION_CLASS))
                .filter(anchor => normalizeURL(anchor.href, anchor.ownerDocument.baseURI) === expectedURL)
                .filter(anchor => !anchor.querySelector('img'))
                .filter(visibilityPredicate)
                .filter(isActionLink)) {
                matches.add(anchor);
            }
        }

        return matches.size;
    }

    function collectDiagnostics(root, visibilityPredicate = isElementVisible) {
        const images = [...root.querySelectorAll('img[src], img[srcset]')];
        const anchors = [...root.querySelectorAll('a[href]')];
        const actionLinks = anchors
            .filter(anchor => !anchor.classList.contains(EXTENSION_CLASS))
            .filter(anchor => !anchor.querySelector('img'))
            .filter(isActionLink);
        const result = findActiveResult(root, visibilityPredicate);

        return {
            counts: {
                actionLinks: actionLinks.length,
                anchors: anchors.length,
                extensionButtons: root.querySelectorAll(`.${EXTENSION_CLASS}`).length,
                images: images.length,
                visibleImages: images.filter(visibilityPredicate).length,
            },
            detection: result ? {
                image: describeElement(result.image),
                imageAncestors: describeAncestors(result.image),
                imageURL: truncate(result.imageURL),
                strategy: result.strategy,
                visitButton: describeElement(result.visitButton),
                visitHref: truncate(result.visitButton.href),
            } : null,
            imageCandidates: images
                .map(image => {
                    const rect = image.getBoundingClientRect();
                    const imageLink = image.closest('a[href]');
                    return {
                        area: Math.round(rect.width * rect.height),
                        ancestors: describeAncestors(image),
                        bestImageURL: truncate(getBestImageURL(imageLink || image, image)),
                        currentSrc: truncate(image.currentSrc),
                        height: Math.round(rect.height),
                        linkedActionMatches: imageLink ? countLinkedActionMatches(imageLink, visibilityPredicate) : 0,
                        linkHref: truncate(imageLink?.href),
                        node: describeElement(image),
                        src: truncate(image.getAttribute('src')),
                        visible: visibilityPredicate(image),
                        width: Math.round(rect.width),
                    };
                })
                .sort((left, right) => right.area - left.area)
                .slice(0, 25),
            actionCandidates: actionLinks
                .map(anchor => {
                    const detachedImage = findDetachedImage(anchor, visibilityPredicate);
                    return {
                        ancestors: describeAncestors(anchor),
                        ariaLabel: truncate(anchor.getAttribute('aria-label') || anchor.querySelector('[aria-label]')?.getAttribute('aria-label'), 200),
                        detachedImage: describeElement(detachedImage?.image),
                        detachedImageArea: detachedImage?.area || 0,
                        detachedImageURL: truncate(detachedImage?.imageURL),
                        hasMatchingHeading: hasMatchingHeadingLink(anchor),
                        href: truncate(anchor.href),
                        node: describeElement(anchor),
                        target: anchor.target || '',
                        text: truncate(anchor.textContent.replace(/\s+/g, ' ').trim(), 200),
                        visible: visibilityPredicate(anchor),
                    };
                })
                .slice(0, 25),
        };
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
        collectDiagnostics,
        findActiveResult,
        getBestImageURL,
        isElementVisible,
        isGoogleThumbnail,
        isSupportedImagesURL,
        syncViewImageButton,
    });
}));
