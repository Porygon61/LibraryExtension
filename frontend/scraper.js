import { getCleanUrl, getConfigs } from "./helper.js";

export function execScraper(url, tabId, pageType) {
    if (pageType === "readingPage") {
        handleReadingPage(url, tabId);
    } else if (pageType === "infoPage") {
        handleInfoPage(url, tabId);
    }
}

// All returns === success variable
async function handleInfoPage(tabUrl, tabId) {
    try {
        const domain = new URL(tabUrl).hostname.replace("www.", "");
        const { config, websitesConfig, currentSiteConfig } = await getConfigs(domain);

        if (!currentSiteConfig) return false;

        let mangaUrl = tabUrl;

        // Clean Slug
        getCleanUrl(tabUrl, currentSiteConfig, "infoPage", tabId).then((res) => {
            mangaUrl = res;
        });

        // Check if entry already exists
        const entryRes = await fetch(
            `http://localhost:6767/library/entry`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: mangaUrl }),
        });
        const entry = await entryRes.json();
        const currentCh = entry?.currentCh || "N/A";
        const dbColumns = Object.keys(config.database.tables.bookmarks);

        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: scraper,
            args: [currentSiteConfig, "infoPage"],
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
                        mangaUrl: mangaUrl,
                        currentCh: currentCh,
                        website: domain,
                    };
                    const res = await fetch(
                        "http://localhost:6767/library/entry",
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                url: mangaUrl,
                                entry: syncedEntry,
                            }),
                        },
                    );

                    if (!res.ok) throw new Error("Server returned an error");
                }
            }
        );
        return true;
    } catch (error) {
        return false;
    }
}

function scraper(siteConfig, pageType) {
    if (!siteConfig) return { Error: "site config not provided" };

    let data = {}

    for (const [key, rawValue] of Object.entries(siteConfig)) {
        if (!key.startsWith("info_")) continue;
        const cleanKey = key.replace("info_", "");

        if (pageType === "infoPage" && (cleanKey === "currentCh" || cleanKey === "mangaUrl" || cleanKey === "chapterList_Elements")) continue;
        if (pageType === "readingPage" && !(cleanKey === "currentCh" || cleanKey === "latestCh" || cleanKey === "mangaUrl" || cleanKey === "chapterList_Elements")) continue;

        if (!rawValue) {
            data[cleanKey] = "";
            continue;
        }

        let rule;
        try {
            rule = typeof rawValue === "string" ? JSON.parse(rawValue) : rawValue;
        } catch (e) {
            rule = { selector: rawValue, takeFirst: false, isArray: false, elementFilter: "", contentFilter: "" };
        }

        const { selector, takeFirst, isArray, elementFilter, contentFilter } = rule;

        if (!selector || selector.trim() === "") {
            data[cleanKey] = isArray ? [] : "";
            continue;
        }

        try {
            let elements = [];

            const snapshot = document.evaluate(selector, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            for (let i = 0; i < snapshot.snapshotLength; i++) {
                elements.push(snapshot.snapshotItem(i));
            }

            if (elements.length > 0) {
                let extracted = elements.map((el) => {
                    const clone = el.cloneNode(true);
                    if (clone.tagName === "IMG") return clone.src;
                    if (clone.tagName === "A" && clone.getAttribute("title") && clone.textContent.trim() === "") return clone.getAttribute("title");

                    if (elementFilter && elementFilter.trim() !== "") {
                        try {
                            clone.querySelectorAll(elementFilter).forEach((ex) => ex.remove());
                        } catch (e) {
                            console.warn(`Invalid elementFilter for ${key}:`, e);
                        }
                    }

                    let finalText = "";
                    const textNodes = Array.from(clone.childNodes).filter((node) => node.nodeType === 3 && node.textContent.trim().length > 0);

                    if (textNodes.length > 0) {
                        finalText = textNodes.map((node) => node.textContent.trim()).join(" ");
                    } else {
                        finalText = clone.textContent.replace(/\s\s+/g, " ").trim();
                    }

                    // option tag fallback
                    if (!finalText && clone.value !== undefined) {
                        finalText = clone.value;
                    }

                    if (contentFilter && contentFilter.trim() !== "") {
                        try {
                            const filters = contentFilter.split(",").map(f => f.trim());
                            filters.forEach((str) => {
                                let regex;
                                if (str.startsWith("/") && str.match(/\/[gimsuy]*$/)) {
                                    const lastSlash = str.lastIndexOf("/");
                                    const pattern = str.substring(1, lastSlash);
                                    const flags = str.substring(lastSlash + 1);
                                    regex = new RegExp(pattern, flags);
                                } else {
                                    // Escape standard strings and create a global regex
                                    const escapedStr = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
                                    regex = new RegExp(escapedStr, "gi");
                                }
                                finalText = finalText.replace(regex, "");
                            });
                        } catch (e) {
                            console.warn(`Invalid contentFilter regex for ${key}:`, e);
                        }
                    }

                    return finalText.trim();
                }).filter((val) => val !== "");

                if (cleanKey === "chapterList_Elements") {
                    let MaxVal = 0;
                    extracted.forEach((text) => {
                        let match = String(text).match(/\d+(\.\d+)?/);
                        let cleanNum = match ? parseFloat(match[0]) : NaN;
                        if (!isNaN(cleanNum) && cleanNum > maxVal) {
                            maxVal = cleanNum;
                        }
                    });
                    if (maxVal > 0) extracted = [maxVal.toString()];
                } else if (takeFirst && extracted.length > 0) {
                    extracted = [extracted[0]];
                }

                data[cleanKey] = extracted.join(" ");
            } else {
                data[cleanKey] = isArray ? [] : "";
            }
        } catch (error) {
            console.error(`Scraping error for ${key}:`, error);
            data[cleanKey] = isArray ? [] : "Error";
        }
    }
    return data;
}

// reading Page

function getMaxChapterFromDropdown() {
    const selector = pageConfig.selectors?.chapter_list_dropdown;
    if (!selector || selector.trim() === "") return null;

    let elements = [];
    try {
        if (selector.startsWith("xpath:")) {
            const xpath = selector.replace("xpath:", "").trim();
            const snapshot = document.evaluate(
                xpath,
                document,
                null,
                XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                null,
            );
            for (let i = 0; i < snapshot.snapshotLength; i++) {
                elements.push(snapshot.snapshotItem(i));
            }
        } else {
            elements = Array.from(document.querySelectorAll(selector));
        }
    } catch (e) {
        console.warn("Failed to parse chapter_list_dropdown selector:", e);
        return null;
    }

    if (elements.length === 0) return null;

    let maxChapter = 0;

    elements.forEach((el) => {
        // Feed the element through the standard scraper exclusions/replacements
        let text = extractTextWithConfig(el, "chapter_list_dropdown");

        // Fallback for <option> tags if standard text extraction returned empty
        if (!text && el.value) {
            text = el.value;
        }

        // Extract the first contiguous number block after replacements
        let match = String(text).match(/\d+(\.\d+)?/);
        let cleanNum = match ? parseFloat(match[0]) : NaN;

        if (!isNaN(cleanNum) && cleanNum > maxChapter) {
            maxChapter = cleanNum;
        }
    });

    return maxChapter > 0 ? maxChapter.toString() : null;
}


