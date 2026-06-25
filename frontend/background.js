import { execScraper } from "./scraper.js";
import { getCleanUrl, getPageType, getConfigs } from "./helper.js";

chrome.runtime.onInstalled.addListener(() => {
    updateBadge(false);

    chrome.contextMenus.create({
        id: "checkLibraryContextMenu",
        title: "Search in Library",
        contexts: ["link"],
    });
});

function updateBadge(connected) {
    //const text = connected ? "ON" : "OFF";
    const color = connected ? "#4CAF50" : "#F44336";
    //chrome.action.setBadgeText({ text: text });
    chrome.action.setBadgeBackgroundColor({ color: color });
    chrome.storage.local.set({ isReachable: connected });
}

async function checkConnection() {
    try {
        const response = await fetch("http://localhost:6767/api/ping", { method: "HEAD" });
        updateBadge(response.ok);
    } catch (error) {
        updateBadge(false);
    }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "checkLibraryContextMenu") {
        const targetUrl = info.linkUrl;

        chrome.windows.create({
            url: chrome.runtime.getURL(
                `popup/popup.html?url=${encodeURIComponent(targetUrl)}`,
            ),
            type: "popup",
            height: 370,
            width: 500
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkServer") checkConnection();
    if (request.action === "addWebsite") {
        const { domain, name } = request;

        fetch("http://localhost:6767/mapping", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: name,
                type: "website",
                extraData: { domain: domain }
            }),
        });
    }
    if (request.action === "runScraper") {
        const baseUrl = request.baseUrl;
        const pageType = request.pageType;
        if (pageType === "readingPage") {
            const { curCh, latestCh } = execScraper(baseUrl, sender.tab.id, pageType);
            if (!curCh || !latestCh) return sendResponse({ success: false });
            sendResponse({ success: true, result: { curCh: curCh, latestCh: latestCh } });
        } else if (pageType === "infoPage") {
            execScraper(null, pageType).then((success) => sendResponse({ success: true }));
        }
    }
    if (request.action === "getConfigs") {
        const domain = request.domain;
        const { config, websitesConfig, currentSiteConfig } = getConfigs(domain);
        sendResponse({ success: true, result: { config, websitesConfig, currentSiteConfig } });
    }
    if (request.action === "getCleanUrl") {
        const url = request.url;
        const pageType = request.pageType;
        const siteConfig = request.siteConfig;
        const cleanUrl = getCleanUrl(url, siteConfig, pageType, sender.tab.id);
        sendResponse({ success: true, result: cleanUrl });
    }
    if (request.action === "getPageType") {
        const url = request.url;
        const siteConfig = request.siteConfig;
        const pageType = getPageType(url, siteConfig);
        sendResponse({ success: true, result: pageType });
    }
});


checkConnection();