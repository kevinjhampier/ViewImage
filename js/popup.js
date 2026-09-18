'use strict';

// On options button click
document.getElementById('options-page').addEventListener('click', function () {
    chrome.runtime.openOptionsPage();
});

// Get extension and platform information
var manifestData = chrome.runtime.getManifest();
chrome.runtime.getPlatformInfo(function (info) {
    var versionString = 'v' + manifestData.version + ' (' + info.os + ' ' + info.nacl_arch + ')  - ' + manifestData.current_locale;
    document.getElementById('version-info').innerText = versionString;
});
