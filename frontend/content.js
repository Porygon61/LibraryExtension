let pageConfig = null;
let currentTabId = null;
let globalSettings = {
    enableReadingPageFeatures: true,
    enableInfoPageFeatures: true
}

async function init() {
    const { isReachable } = await chrome.storage.local.get(["isReachable"]);

    const oldContainer = document.getElementById("CatzeLibrary_Content-Container");
    if (oldContainer) oldContainer.remove();

    if (!isReachable) return;
    currentTabId = window.tabId;

    setContent();
}

async function setContent() {
    try {
        const domain = window.location.hostname.replace("www.", "");

        chrome.runtime.sendMessage(
            { action: "getConfigs", domain: domain },
            (res) => {
                if (res && res.success) {
                    const { config, websitesConfig, currentSiteConfig } = res.result;
                }
            },
        );

        if (config.settings.insertionSettings) globalSettings = config.settings.insertionSettings;

        if (currentSiteConfig) {
            const url = window.location.href;
            chrome.runtime.sendMessage(
                { action: "getPageType", context: "content", url: url, siteConfig: currentSiteConfig },
                (res) => {
                    if (res && res.success) {
                        const pageType = res.result;
                    }
                },
            )

            if (pageType === "readingPage" && globalSettings.enableReadingPageFeatures) {
                chrome.runtime.sendMessage(
                    { action: "getCleanUrl", context: "content", pageType: "readingPage", url: url, siteConfig: currentSiteConfig },
                    (res) => {
                        if (res && res.success) {
                            const baseUrl = res.result;
                        }
                    },
                );

                chrome.runtime.sendMessage(
                    { action: "runScraper", context: "content", pageType: "readingPage", baseUrl: baseUrl },
                    (res) => {
                        if (res && res.success) {
                            result = res.result;
                            let curCh = result.curCh;
                            let latestCh = result.latestCh;
                        } else {
                            let curCh = "-";
                            let latestCh = "-";
                        }
                    },
                );

                let savedCh = "-";

                try {
                    const res = await fetch("http://localhost:6767/library/search", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ url: baseUrl })
                    });
                    const entry = await res.json();

                    if (entry) {
                        if (entry.currentCh)
                            savedCh = entry.currentCh;
                        if (entry.latestChapter && latestCh === "-")
                            latestCh = entry.latestChapter;

                        if (latestCh !== "-") {
                            silentUpdate_LatestCh(entry, latestCh, baseUrl);
                        }
                    }
                }
                catch (error) { }

                injectButton(
                    "↻",
                    "ProgressUpdate",
                    () => progress_ClickHandler(baseUrl, curCh, latestCh),
                    savedCh,
                    curCh,
                    latestCh,
                );
            } else if (pageType === "infoPage" && globalSettings.enableInfoPageFeatures) {
                injectButton(
                    "+",
                    "AddNew",
                    () => addNew_ClickHandler(url, currentTabId),
                );
            }
        }
    } catch (error) {

    }
}

function silentUpdate_LatestCh(entry, latestCh, baseUrl) {
    const latestDBCh = parseFloat(String(entry.latestChapter || "0").replace(/[^\d.]/g, "",));
    const latestPageCh = parseFloat(latestCh);
    if (latestPageCh > latestDBCh) {
        fetch("http://localhost:6767/library/entry", {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ url: baseUrl, updates: { latestChapter: latestCh } })
        });
    }
}

function injectButton(
    icon,
    title,
    clickHandler,
    saved = null,
    scraped = null,
    latest = null,
) {

    // CREATE CONTAINER
    const container = document.createElement("div");
    container.id = "CatzeLibrary_Content-Container";
    Object.assign(container.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: "2147483647",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "6px",
    });

    // CREATE INFO DISPLAY
    if (saved !== null && scraped !== null) {
        const infoDisplay = document.createElement("div");
        Object.assign(infoDisplay.style, {
            background: "rgba(44, 62, 80, 0.95)",
            color: "#ecf0f1",
            padding: "6px 10px",
            borderRadius: "6px",
            fontSize: "12px",
            fontFamily: "Arial, sans-serif",
            backdropFilter: "blur(4px)",
            border: "1px solid #34495e",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            display: "flex",
            gap: "8px",
        });
        let latestHtml =
            latest && latest !== "?"
                ? `<span style="color:#7f8c8d">|</span><span>Latest: <b style="color:#9b59b6">${latest}</b></span>`
                : "";

        infoDisplay.innerHTML = `
            <span>Saved: <b style="color:#f1c40f">${saved}</b></span>
            <span style="color:#7f8c8d">|</span>
            <span>New: <b style="color:#2ecc71">${scraped}</b></span>
            ${latestHtml}
        `;
        container.appendChild(infoDisplay);
    }

    // CREATE BUTTON
    const btn = document.createElement("button");
    btn.id = "catze-library-button";
    btn.innerHTML = `<span>${icon}</span>`;
    btn.title = title;
    Object.assign(btn.style, {
        padding: "12px 18px",
        backgroundColor: "#2c3e50",
        color: "white",
        border: "2px solid #34495e",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "18px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    });
    btn.onclick = (e) => {
        e.preventDefault();
        clickHandler();
    };

    container.appendChild(btn);
    document.body.appendChild(container);
}

async function progress_ClickHandler(baseUrl, curCh, latestCh) {
    const btn = document.getElementById("catze-library-button");
    const cleanNum = curCh ? curCh.replace(/[^\d.]/g, "") : "";

    if (!cleanNum || curCh === "-") {
        updateBtn(btn, "Err/Not Found", "#e74c3c", "↻", true);
        return;
    }

    try {

        const res = await fetch("http://localhost:6767/library/entry", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: baseUrl, updates: { currentCh: cleanNum } }),
        });

        const result = await res.json();
        if (result.success) {
            updateBtn(btn, "✓", "#27ae60", "↻", true);

            const container = document.getElementById(
                "CatzeLibrary_Content-Container",
            );
            if (
                container &&
                container.firstChild &&
                container.firstChild.id !== "catze-library-button"
            ) {
                // Re-fetch the latest so we don't lose it on the visual refresh
                let latestHtml =
                    latestCh && latestCh !== "-"
                        ? `<span style="color:#7f8c8d">|</span><span>Latest: <b style="color:#9b59b6">${latestCh}</b></span>`
                        : "";

                container.firstChild.innerHTML = `
                    <span>Saved: <b style="color:#f1c40f">${cleanNum}</b></span>
                    <span style="color:#7f8c8d">|</span>
                    <span>New: <b style="color:#2ecc71">${cleanNum}</b></span>
                    ${latestHtml}
                `;
            }
        } else {
            updateBtn(btn, "Not in Lib", "#e67e22", "↻", true);

        }
    } catch (err) {
        updateBtn(btn, "Offline", "#e74c3c", "↻");

    }
}

function addNew_ClickHandler(url, tabId) {
    const btn = document.getElementById("catze-library-button");
    updateBtn(btn, "Syncing...", "#e67e22", "+");
    chrome.runtime.sendMessage(
        { action: "runScraper", context: "content", pageType: "infoPage" },
        (res) => {
            if (res && res.success) {
                updateBtn(btn, "Done", "#27ae60", "+", true);
            } else {
                updateBtn(btn, "Failed", "#e74c3c", "+", true);
            }
        });
}

function updateBtn(btn, text, color, originalIcon, reset = false) {
    if (!btn) return;
    btn.innerText = text;
    btn.style.backgroundColor = color;
    if (reset) {
        setTimeout(() => {
            btn.innerHTML = `<span>${originalIcon}</span>`;
            btn.style.backgroundColor = "#2c3e50";
        }, 2500);
    }
}

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;

        const oldContainer = document.getElementById(
            "manga-sync-fixed-btn-container",
        );
        if (oldContainer) oldContainer.remove();

        setTimeout(initContentScript, 1000);
    }
}).observe(document, { subtree: true, childList: true });

init();