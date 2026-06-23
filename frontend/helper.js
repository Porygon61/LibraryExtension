export async function getCleanUrl(url, siteConfig, pageType, tabId = null) {
    let resultUrl = url;

    switch (pageType) {
        case "readingPage":
            if (siteConfig.info_mangaUrl && tabId) {
                try {
                    // Parse the JSON string from the database first
                    let parsedInfoUrl = siteConfig.info_mangaUrl;
                    if (typeof parsedInfoUrl === "string") {
                        parsedInfoUrl = JSON.parse(parsedInfoUrl);
                    }

                    if (parsedInfoUrl?.selector) {
                        const results = await chrome.scripting.executeScript({
                            target: { tabId: tabId },
                            func: (sel) => {
                                const el = document.querySelector(sel);
                                return el ? el.href : null;
                            },
                            args: [parsedInfoUrl.selector],
                        });
                        if (results && results[0] && results[0].result) {
                            resultUrl = results[0].result;
                        }
                    }
                } catch (e) {
                    console.error("Failed to extract reading page URL:", e);
                }
            }
            break;
        case "infoPage":
            if (siteConfig.baseUrl) {
                let cleanUrl = resultUrl.replace("www.", "");
                let cleanBase = siteConfig.baseUrl.replace("www.", "");
                if (cleanUrl.includes(cleanBase)) {
                    let pathAfterBase = cleanUrl.replace(cleanBase, "");
                    let mangaSlug = pathAfterBase.split("/")[0];

                    if (siteConfig.slugCleaner) {
                        const regex = new RegExp(siteConfig.slugCleaner, "i");
                        mangaSlug = mangaSlug.replace(regex, "");
                    }

                    return siteConfig.baseUrl + mangaSlug + "/";
                }
            }
            break;
    }

    return resultUrl;
}

export function getPageType(url, siteConfig) {
    if (!siteConfig || !siteConfig.siteStructure) return null;
    const cleanUrl = url.split("?")[0].split("#")[0];

    let structureObj = siteConfig.siteStructure;
    if (typeof structureObj === "string") {
        try {
            structureObj = JSON.parse(structureObj);
        } catch (error) {
            console.error("Error parsing site structure:", error);
            return "unknown";
        }
    }

    for (const [type, pattern] of Object.entries(structureObj)) {
        const regex = new RegExp(pattern);
        if (regex.test(cleanUrl)) return type;
    }
    return "unknown";
}

export async function getConfigs(domain) {
    let config = null;
    let websitesConfig = null;
    let currentSiteConfig = null;

    try {
        const localConfig = await chrome.storage.local.get(["config"]);
        if (localConfig.config) {
            config = localConfig.config;
        } else {
            // Fallback if background script hasn't cached it yet
            const configRes = await fetch(
                "http://localhost:6767/system/config",
            );
            config = await configRes.json();
        }
        const localWebsiteConfig = await chrome.storage.local.get([
            "websiteConfig",
        ]);
        if (localWebsiteConfig.websiteConfig) {
            websitesConfig = localWebsiteConfig.websiteConfig;
        } else {
            const websiteConfigRes = await fetch(
                "http://localhost:6767/system/websitesConfig",
            );
            const resData = await websiteConfigRes.json();
            websitesConfig = resData.success ? resData.data : {};
        }
    } catch (err) {
        console.error("Error fetching configs:", err);
        return { config: null, websitesConfig: null, currentSiteConfig: null };
    }

    currentSiteConfig = websitesConfig ? websitesConfig[domain] : null;

    return { config, websitesConfig, currentSiteConfig };
}