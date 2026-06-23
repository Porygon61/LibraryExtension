import { execScraper } from "./popup/scraper.js";
import { getCleanUrl, getPageType, getConfigs } from "./helper.js";

chrome.runtime.onInstalled.addListener(() => {
    updateBadge(false);

    chrome.contextMenus.create({
        id: "checkLibraryContextMenu",
        title: "Check Manga in Library",
        contexts: ["link"],
    });
});

function updateBadge(connected) {
    const text = connected ? "ON" : "OFF";
    const color = connected ? "#4CAF50" : "#F44336";
    chrome.action.setBadgeText({ text: text });
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
            width: 380,
            height: 620,
        });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "infoPageButton_clicked") {
        const tabId = sender.tab.id;
        const url = sender.tab.url;
        handleBackgroundSync(url, tabId).then((success) =>
            sendResponse({ success: success }),
        );
        return true;
    }
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
});

// TODO : Check, only pasted in
async function handleBackgroundSync(tabUrl, tabId) {
    let config = null;
    let websitesConfig = null;
    let siteConfig = null;
    try {

        const domain = new URL(tabUrl).hostname.replace("www.", "");
        ({ config, siteConfig, currentSiteConfig } = getConfigs(domain));

        const pageType = getPageType(tabUrl, siteConfig);
        if (!siteConfig) return false;

        let mangaIdUrl = tabUrl;

        const cleanUrl = await getCleanUrl(tabUrl, siteConfig, pageType, tabId);
        if (cleanUrl) {
            mangaIdUrl = cleanUrl;
        }

        const entryRes = await fetch(
            `http://localhost:3000/data/library/search`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: mangaIdUrl }),
            },
        );
        const existingEntry = await entryRes.json();
        const currentProgress = existingEntry?.currentCh || "N/A";
        const dbColumns = Object.keys(config.database.tables.bookmarks);

        chrome.scripting.executeScript(
            {
                target: { tabId: tabId },
                func: execScraper,
                args: [masterConfig, domain],
            },
            async (results) => {
                const scraped = results[0]?.result;

                if (scraped && !scraped.Error) {
                    let filteredScraped = {};
                    dbColumns.forEach((col) => {
                        if (scraped[col] !== undefined) {
                            filteredScraped[col] = scraped[col];
                        }
                    });

                    const syncedEntry = {
                        ...filteredScraped,
                        url: mangaIdUrl,
                        currentCh: currentProgress,
                    };
                    const res = await fetch(
                        "http://localhost:6767/library/entry",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                url: mangaIdUrl,
                                entry: syncedEntry,
                            }),
                        },
                    );

                    if (!res.ok) throw new Error("Server returned an error");
                }
            },
        );
        return true;
    } catch (err) {
        return false;
    }
}

checkConnection();