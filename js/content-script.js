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
    let mutationCount = 0;
    let scheduleCount = 0;
    const syncHistory = [];
    let updateScheduled = false;

    function getButtonText() {
        if (options['manually-set-button-text'] && options['button-text-view-image'].trim()) {
            return options['button-text-view-image'].trim();
        }

        return chrome.i18n.getMessage('viewImage') || 'View image';
    }

    function updateButton() {
        updateScheduled = false;
        try {
            const result = core.syncViewImageButton(document, options, getButtonText());
            syncHistory.push({
                imageURL: result.imageURL || '',
                state: result.state,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            syncHistory.push({
                error: error instanceof Error ? error.message : String(error),
                state: 'error',
                timestamp: new Date().toISOString(),
            });
        }

        if (syncHistory.length > 20) {
            syncHistory.splice(0, syncHistory.length - 20);
        }
    }

    function scheduleUpdate() {
        scheduleCount += 1;
        if (updateScheduled) {
            return;
        }

        updateScheduled = true;
        setTimeout(updateButton, 0);
    }

    function createDiagnosticReport() {
        return {
            core: core.collectDiagnostics(document),
            extension: {
                id: chrome.runtime.id,
                version: chrome.runtime.getManifest().version,
            },
            generatedAt: new Date().toISOString(),
            observer: {
                mutationCount,
                scheduleCount,
                syncHistory: [...syncHistory],
                updateScheduled,
            },
            options: { ...options },
            page: {
                documentReadyState: document.readyState,
                language: document.documentElement.lang || '',
                title: document.title,
                url: document.location.href,
                visibilityState: document.visibilityState,
            },
            userAgent: navigator.userAgent,
        };
    }

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message?.type !== 'view-image:collect-diagnostics') {
            return false;
        }

        try {
            sendResponse({ ok: true, report: createDiagnosticReport() });
        } catch (error) {
            sendResponse({
                error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
                ok: false,
            });
        }

        return false;
    });

    const observer = new MutationObserver(function (mutations) {
        mutationCount += mutations.length;
        scheduleUpdate();
    });

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
