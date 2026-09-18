'use strict';

// On options button click
document.getElementById('options-page').addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
});

// Get debug info
var manifestData = chrome.runtime.getManifest();
chrome.runtime.getPlatformInfo(function (info) {
    var debugString = 'v' + manifestData.version + ' (' + info.os + ' ' + info.nacl_arch + ')  - ' + manifestData.current_locale;
    document.getElementById('debug').innerText = debugString;
});

const diagnosticOutput = document.getElementById('diagnostic-output');
const diagnosticStatus = document.getElementById('diagnostic-status');
const downloadButton = document.getElementById('download-diagnostics');
let diagnosticText = '';

function message(name, fallback) {
    return chrome.i18n.getMessage(name) || fallback;
}

function createUnavailableReport(error) {
    return {
        error,
        extension: {
            id: chrome.runtime.id,
            version: manifestData.version,
        },
        generatedAt: new Date().toISOString(),
        status: 'content-script-unreachable',
        userAgent: navigator.userAgent,
    };
}

function formatReport(report) {
    return [
        'VIEW IMAGE DIAGNOSTIC REPORT',
        'Review URLs in this report before sharing it.',
        '',
        JSON.stringify(report, null, 2),
        '',
    ].join('\n');
}

function showReport(report) {
    diagnosticText = formatReport(report);
    diagnosticOutput.value = diagnosticText;
    diagnosticOutput.classList.add('has-report');
    downloadButton.disabled = false;
    diagnosticStatus.textContent = report.status === 'content-script-unreachable'
        ? message('diagnosticsUnavailable', 'The content script did not respond. Export this report because the error is useful.')
        : message('diagnosticsReady', 'Diagnostic report ready.');
}

document.getElementById('generate-diagnostics').addEventListener('click', function () {
    diagnosticStatus.textContent = message('diagnosticsCollecting', 'Collecting diagnostics…');
    downloadButton.disabled = true;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const queryError = chrome.runtime.lastError;
        const tab = tabs?.[0];

        if (queryError || !tab?.id) {
            showReport(createUnavailableReport(queryError?.message || 'No active tab was returned.'));
            return;
        }

        chrome.tabs.sendMessage(tab.id, { type: 'view-image:collect-diagnostics' }, function (response) {
            const messageError = chrome.runtime.lastError;
            if (messageError || !response?.ok) {
                showReport(createUnavailableReport(
                    messageError?.message || response?.error || 'The content script returned no report.',
                ));
                return;
            }

            showReport(response.report);
        });
    });
});

downloadButton.addEventListener('click', function () {
    if (!diagnosticText) {
        return;
    }

    const blob = new Blob([diagnosticText], { type: 'text/plain;charset=utf-8' });
    const objectURL = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.href = objectURL;
    link.download = `view-image-diagnostics-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectURL), 1000);
});
