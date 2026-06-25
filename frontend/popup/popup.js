import { execScraper } from "../scraper.js";
import { getCleanUrl, getPageType, getConfigs } from "../helper.js";

let currentUrl = "";
let config = {};
let websitesConfig = {};
let currentSiteConfig = null;
let currentPageType = null;
let currentEntry = null;

async function init() {
    // 1. Get URL from query params or active tab
    const urlParams = new URLSearchParams(window.location.search);
    let targetUrl = urlParams.get("url") || "";
    let tabId = null;
    let tabTitle = "";
    if (targetUrl) {
        currentUrl = targetUrl;
    } else {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        currentUrl = tab.url;
        tabId = tab.id;
        tabTitle = tab.title;
    }

    // 2. Check if URL is valid and extract domain
    let domain = "";
    let isPureDomain = false;
    try {
        const urlObj = new URL(currentUrl);
        // Only allow http and https URLs
        if (!["http:", "https:"].includes(urlObj.protocol)) {
            throw new Error("Invalid protocol");
        }
        domain = urlObj.hostname.replace("www.", "");
        isPureDomain = urlObj.pathname === "/" && !urlObj.search && !urlObj.hash;
    } catch (e) {
        document.body.innerHTML = `
            <div style="padding:20px; text-align:center; color: #546e7a;">
                <h3>Invalid Page</h3>
                <p style="font-size:12px;">Open the popup on a valid manga webpage.</p>
            </div>`;
        return;
    }

    // 3. Check if Server is reachable
    chrome.runtime.sendMessage({ action: "checkServer" });
    const storage = await chrome.storage.local.get(["isReachable"]);
    if (!storage.isReachable) {
        document.body.innerHTML = `
            <div style="padding:20px; text-align:center; color: #546e7a;">
                <h3>Server Unreachable</h3>
                <p style="font-size:12px;">Make sure the backend server is running.</p>
                <button id="retryBtn" style="margin-top:10px; padding:5px 10px; background:#546e7a; color:white; border:none; border-radius:3px; cursor:pointer;">Retry</button>
            </div>
        `;
        document.getElementById("retryBtn").addEventListener("click", () => {
            init();
        });
        return;
    }

    // 4. Fetch Configurations
    ({ config, websitesConfig, currentSiteConfig } = await getConfigs(domain));

    const websites = await fetchMappingWebsites();
    async function fetchMappingWebsites() {
        try {
            const response = await fetch("http://localhost:6767/mapping/websites", { method: "GET" });
            const result = await response.json();
            return result.success ? result.data : [];
        } catch (error) {
            console.error("Error fetching mapping websites:", error);
            return [];
        }
    }

    if (!currentSiteConfig) {
        if (isPureDomain) {
            const usableDomainName = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
            const domainExists = websites.some(website => {
                let extra = website.extraData;
                if (typeof extra === "string") {
                    try { extra = JSON.parse(extra); } catch (e) { extra = null; }
                }
                return extra?.domain === domain;
            });
            document.body.innerHTML = `
                <div style="padding:20px; text-align:center; color: #546e7a;">
                    <h3>Site Not Supported</h3>
                    <p style="font-size:12px;">Add <b>${domain}</b> to your config to track this manga.</p>
                    ${!domainExists ? `<button id="addWebsiteBtn" style="margin-top: 15px; padding: 10px; background: #575757; color: white; border: none; border-radius: 6px; cursor: pointer;">Add Website</button>` : ''}
                </div>`;
            if (!domainExists) document
                .getElementById("addWebsiteBtn")
                .addEventListener("click", () => {
                    chrome.runtime.sendMessage({
                        action: "addWebsite",
                        domain: domain,
                        name: usableDomainName,
                    });
                });
        } else {
            document.body.innerHTML = `
                <div style="padding:20px; text-align:center; color: #546e7a;">
                    <h3>Site Not Supported</h3>
                    <p style="font-size:12px;">To add <b>${domain}</b> to your configuration, please navigate to its main homepage first.</p>
                </div>`;
        }
        return;
    }

    currentPageType = getPageType(currentUrl, currentSiteConfig);

    if (!currentPageType || currentPageType === "unknown") {
        showNoData();
        document.getElementById("metaDisplay").innerHTML =
            "<center style='color:#999; padding:20px;'>This page is not recognized as a valid Info or Reading page.</center>";
        return;
    }

    const searchUrl = await getCleanUrl(
        currentUrl,
        currentSiteConfig,
        currentPageType,
        targetUrl ? null : tabId,
    );
    currentUrl = searchUrl;

    fetch(`http://localhost:6767/library/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: currentUrl }),
    })
        .then((res) => {
            if (!res.ok) return null;
            return res.json();
        })
        .then((entry) => {
            if (entry && entry.id) {
                renderTracker(entry);
            } else {
                showNoData();
            }
        })
        .catch(() => showNoData());

    document.getElementById("btnEdit").addEventListener("click", () => {
        if (!currentEntry) return;
        window.open(`http://localhost:6767/library/manga/${currentEntry.id}/edit`, "_blank");
    });

    document.getElementById("btnDelete").addEventListener("click", () => {
        if (!currentEntry) return;
        if (confirm("Are you sure you want to delete this entry?")) {
            fetch(`http://localhost:6767/library/entry`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: currentEntry.id }),
            });
            showNoData();
        }
    });

    document.getElementById("btnManualAdd").addEventListener("click", () => {
        window.open(`http://localhost:6767/library/manga/add`, "_blank");
    });

    document.getElementById("btnSettings").addEventListener("click", () => {
        window.open(`http://localhost:6767/settings`, "_blank");
    });
}

function renderTracker(entry) {
    currentEntry = entry;

    document.getElementById("curCh").innerText = entry.currentCh || "N/A";

    const coverContainer = document.getElementById("coverContainer");
    coverContainer.innerHTML = "";
    if (entry.coverImgID) {
        const link = document.createElement("a");
        // TODO add page (not created yet and also add route)
        link.href = "http://localhost:6767/library/manga/" + entry.id;
        link.target = "_blank";
        link.className = "cover-link";
        link.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i>`;
        const img = document.createElement("img");
        fetch("http://localhost:6767/mapping/cover", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: entry.coverImgID }),
        })
            .then((res) => res.json())
            .then((tag) => {
                img.src = `http://localhost:6767/covers/${entry.id}/${tag.name}.jpg`;
            });

        img.className = "tracker-cover";
        img.onerror = function () {
            this.onerror = null;
            this.src = "http://localhost:6767/covers/placeholder.jpg";
            this.style.opacity = "0.5";
        };
        coverContainer.appendChild(link);
        link.appendChild(img);
    }

    const meta = document.getElementById("metaDisplay");
    meta.innerHTML = "";

    Object.entries(entry).forEach(([key, val]) => {
        if (["id", "currentCh", "coverImage", "nsfw"].includes(key))
            return;

        const div = document.createElement("div");
        div.className = "info-row";
        div.innerHTML = `<div class="info-label">${key.replace(/_/g, " ")}</div>`;
        let displayVal = val;
        try {
            let parsed = JSON.parse(val);
            if (Array.isArray(parsed)) {
                const array = document.createElement("div");
                array.className = "array-container";
                parsed.forEach((item) => {
                    const span = document.createElement("span");
                    span.className = "array-item";
                    span.innerText = item;
                    array.appendChild(span);
                });
                div.appendChild(array);
            } else {
                throw new Error();
            }
        } catch (e) {
            const value = document.createElement("div");
            value.className = "info-value";
            value.innerText = displayVal || "-";
            div.appendChild = value;
        }




        meta.appendChild(div);
    });
}

function showNoData() {
    currentEntry = null;

    document.getElementById("btnDelete").disabled = true;
    document.getElementById("btnEdit").disabled = true;

    document.getElementById("curCh").innerText = "-";
    document.getElementById("coverContainer").innerHTML = "";
    document.getElementById("metaDisplay").innerHTML =
        "<center style='color:#999; padding:20px;'>No data found for this URL.</center>";
}


window.addEventListener("blur", () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("url")) window.close();
});

document.addEventListener("DOMContentLoaded", init);
