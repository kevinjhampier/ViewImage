'use strict';

(function () {
    const core = globalThis.ViewImageCore;

    if (!core) {
        console.error('ViewImage: core module was not loaded.');
        return;
    }

    const FALLBACK_OPTIONS = {
        'open-in-new-tab': true,
        'manually-set-button-text': false,
        'no-referrer': false,
        'button-text-view-image': '',
    };

    let options = { ...FALLBACK_OPTIONS };
    let updateScheduled = false;

    function getButtonText() {
        if (options['manually-set-button-text'] && options['button-text-view-image'].trim()) {
            return options['button-text-view-image'].trim();
        }

        return chrome.i18n.getMessage('viewImage') || 'View image';
    }

    function updateButton() {
        updateScheduled = false;

        if (!core.isSupportedImagesURL(document.location.href)) {
            for (const button of document.querySelectorAll(`.${core.EXTENSION_CLASS}`)) {
                button.remove();
            }
            return;
        }

        core.syncViewImageButton(document, options, getButtonText());
    }

    function scheduleUpdate() {
        if (updateScheduled) {
            return;
        }

        updateScheduled = true;
        setTimeout(updateButton, 0);
    }

    const observer = new MutationObserver(scheduleUpdate);

    chrome.storage.sync.get(['options', 'defaultOptions'], function (storage) {
        options = {
            ...FALLBACK_OPTIONS,
            ...(storage.defaultOptions || {}),
            ...(storage.options || {}),
        };

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-hidden', 'class', 'href', 'src', 'srcset', 'style'],
        });

        scheduleUpdate();
    });

    if (chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(function (changes, areaName) {
            if (areaName !== 'sync') {
                return;
            }

            if (changes.defaultOptions) {
                options = { ...options, ...(changes.defaultOptions.newValue || {}) };
            }

            if (changes.options) {
                options = {
                    ...FALLBACK_OPTIONS,
                    ...(changes.defaultOptions?.newValue || {}),
                    ...(changes.options.newValue || {}),
                };
            }

            scheduleUpdate();
        });
    }

    const customStyle = document.createElement('style');
    customStyle.textContent = `
.vi_ext_addon {
    margin-inline-end: 4px !important;
}

.vi_ext_addon[aria-disabled="true"] {
    cursor: not-allowed !important;
    opacity: 0.65;
}
`;
    document.head.appendChild(customStyle);
}());
