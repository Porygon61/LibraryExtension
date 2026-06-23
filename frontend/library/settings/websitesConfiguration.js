
async function fetchWebsiteData() {
    try {
        const response = await fetch("http://localhost:6767/system/websitesConfig", { method: "GET" });
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

async function fetchWebsiteDataColumns() {
    try {
        const response = await fetch("http://localhost:6767/system/config", { method: "GET" });
        const result = await response.json();
        const columns = result.database.tables.websites;
        return columns;
    } catch (error) {
        console.error("Error fetching data:", error);
        return null;
    }
}

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

let mappingWebsites = [];

async function renderWebsiteDataEditor() {
    const dataColumns = await fetchWebsiteDataColumns();
    if (!dataColumns) return;

    mappingWebsites = await fetchMappingWebsites();

    const dataDisplay_Container = document.getElementById("dataDisplay_Container");
    dataDisplay_Container.innerHTML = "";

    constructHtml(dataDisplay_Container, dataColumns);

    const addConfigBtn = document.getElementById("addConfigBtn");

    const websiteData = await fetchWebsiteData();
    if (!websiteData) return;


    const websitesArray = websiteData ? Object.values(websiteData) : [];

    const websiteConfig_Nav_Container = document.getElementById("websiteConfig_Nav_Container");

    const selectElement = document.getElementById("selectWebsiteConfig");
    selectElement.innerHTML = `
    <option value="">-- Choose a Config --</option>
    ${Object.values(websiteData)
            .map((website) => `<option value="${website.domain}">${website.name}</option>`)
            .join("")}
`;
    websiteConfig_Nav_Container.appendChild(selectElement);

    const selectedWebsite = websitesArray.find(w => w.domain === selectElement.value);


    if (selectElement.value) {
        populateHtml(selectedWebsite);
    }

    addConfigBtn.addEventListener("click", () => {
        const url = new URL(window.location);
        url.searchParams.set("new", "true");
        window.history.pushState({}, "", url);

        selectElement.value = "";
        populateHtml(null);
    })


    selectElement.addEventListener("change", (e) => {
        populateHtml(websiteData[e.target.value]);
    });

    const saveConfigBtn = document.getElementById("saveConfigBtn");
    saveConfigBtn.addEventListener("click", async () => {
        //Validation
        let isValid = true;
        let xpathErrors = [];
        const requiredInputs = dataDisplay_Container.querySelectorAll("input[required], select[required]");

        requiredInputs.forEach(input => {
            if (!input.value || input.value.trim() === "") {
                isValid = false;
                input.style.border = "2px solid red"; // Highlight empty fields
            } else {
                input.style.border = ""; // Reset border if filled
            }
        });

        const selectorInputs = dataDisplay_Container.querySelectorAll('input[data-prop="selector"]');
        const mockDoc = document.implementation.createHTMLDocument("mock");
        selectorInputs.forEach(input => {
            const xpathStr = input.value.trim();

            if (xpathStr !== "") {
                try {
                    document.evaluate(
                        xpathStr,
                        mockDoc,
                        null,
                        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                        null
                    );
                    input.style.border = "";
                } catch (e) {
                    isValid = false;
                    input.style.border = "2px solid red";

                    // Grab the nearest row label name to give a clear feedback message
                    const rowLabel = input.closest(".dataRow")?.querySelector(".dataLabel")?.textContent || "Unknown Selector";
                    xpathErrors.push(`- ${rowLabel.replace(":", "")}: "${xpathStr}"`);
                }
            }
        });

        if (!isValid) {
            let alertMessage = "";

            if (requiredInputs.length && Array.from(requiredInputs).some(i => !i.value)) {
                alertMessage += "Please fill in all required fields marked with an asterisk (*).\n\n";
            }

            if (xpathErrors.length > 0) {
                alertMessage += "The following fields have invalid XPath syntax:\n" + xpathErrors.join("\n");
            }

            alert(alertMessage);
            return; // Abort the save process
        }
        // --------

        const urlParams = new URLSearchParams(window.location.search);
        const isNew = urlParams.get("new") === "true";

        // Get the website ID
        const idSpan = document.querySelector(`.dataValue[data-key="id"]`);
        const id = idSpan?.textContent;

        // Collect changed data
        const changedData = {};
        const dataRows = dataDisplay_Container.querySelectorAll(".dataRow");

        dataRows.forEach((dataRow) => {
            const key = dataRow.id.split("-")[1];

            if (key === "id") return; // Skip ID

            if (key === "siteStructure") {
                const infoInput = dataRow.querySelector(`input[data-prop="infoPage"]`);
                const readInput = dataRow.querySelector(`input[data-prop="readingPage"]`);

                if (infoInput && readInput) {
                    const infoValue = infoInput.value || "";
                    const readValue = readInput.value || "";
                    const infoOld = infoInput.getAttribute("old-value") || "";
                    const readOld = readInput.getAttribute("old-value") || "";

                    if (infoValue !== infoOld || readValue !== readOld) {
                        changedData[key] = JSON.stringify({
                            infoPage: infoValue,
                            readingPage: readValue
                        });
                    }
                }
                return;
            }

            if (key.startsWith("info_")) {
                const selectorInput = dataRow.querySelector(`input[data-prop="selector"]`);
                const takeFirstCheckbox = dataRow.querySelector(`input[data-prop="takeFirst"]`);
                const isArrayCheckbox = dataRow.querySelector(`input[data-prop="isArray"]`);
                const elFilterInput = dataRow.querySelector(`input[data-prop="elementFilter"]`);
                const contentFilterInput = dataRow.querySelector(`input[data-prop="contentFilter"]`);

                const selectorValue = selectorInput?.value || "";
                const takeFirstValue = !!takeFirstCheckbox?.checked;
                const isArrayValue = !!isArrayCheckbox?.checked;
                const elFilterValue = elFilterInput?.value || "";
                const contentFilterValue = contentFilterInput?.value || "";

                const selectorOld = selectorInput?.getAttribute("old-value") || "";
                const takeFirstOld = takeFirstCheckbox?.getAttribute("old-value") === "true";
                const isArrayOld = isArrayCheckbox?.getAttribute("old-value") === "true";
                const elFilterOld = elFilterInput?.getAttribute("old-value") || "";
                const contentFilterOld = contentFilterInput?.getAttribute("old-value") || "";

                const hasChanged = selectorValue !== selectorOld || takeFirstValue !== takeFirstOld ||
                    isArrayValue !== isArrayOld || elFilterValue !== elFilterOld ||
                    contentFilterValue !== contentFilterOld;

                if (hasChanged) {
                    changedData[key] = JSON.stringify({
                        selector: selectorValue,
                        takeFirst: takeFirstValue,
                        isArray: isArrayValue,
                        elementFilter: elFilterValue,
                        contentFilter: contentFilterValue
                    });
                }
                return;
            }

            // Handle regular text inputs
            const input = dataRow.querySelector("input[type='text']");
            if (input) {
                const currentValue = input.value;
                const oldValue = input.getAttribute("old-value");
                if (currentValue !== oldValue) {
                    changedData[key] = currentValue;
                } else if (isNew) {
                    changedData[key] = currentValue;
                }
            }

            // Handle select dropdowns
            const select = dataRow.querySelector("select");
            if (select) {
                const currentValue = select.value;
                const oldValue = select.getAttribute("old-value");
                if (currentValue !== oldValue) {
                    changedData[key] = currentValue;
                }
            }
        });

        if (!isNew && Object.keys(changedData).length === 0) {
            return;
        }

        // Prepare request payload
        const requestData = isNew ? changedData : { id: id, ...changedData };
        const method = isNew ? "POST" : "PATCH";
        const endpoint = "/system/websitesConfig";

        try {
            const response = await fetch(`http://localhost:6767${endpoint}`, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const url = new URL(window.location);
                url.searchParams.delete("new");
                window.history.pushState({}, "", url);

                // Refresh the data
                await renderWebsiteDataEditor();
            } else {
                console.error("Save failed:", response.status, await response.text());
            }
        } catch (error) {
            console.error("Error saving:", error);
        }
    })
}

function constructHtml(container, dataColumns) {
    const columns = Object.keys(dataColumns).filter(key => !key.startsWith("FOREIGN KEY"));
    container.innerHTML = columns.map((key) => {
        if (key === "id") {
            return `
                <div class="dataRow" id=row-${key}>
                        <span class="dataLabel" >${key}:</span>
                        <span class="dataValue" data-key="${key}">0</span>
                    </div>
                `;
        } else if (key === "websiteID") {
            const options = mappingWebsites.map(w => `<option value="${w.id}">${w.name}</option>`).join("");
            return `
                    <div class="dataRow" id=row-${key}>
                        <span class="dataLabel" >${key}: <span style="color: red;">*</span></span>
                        <select class="dataValueInput" data-key="${key}" old-value="" required >
                            <option value="">-- Select Website --</option>
                            ${options}
                        </select>
                    </div>
                `;
        } else if (key === "name" || key === "domain" || key === "baseUrl") {
            return `
                    <div class="dataRow" id=row-${key}>
                        <span class="dataLabel" >${key}: <span style="color: red;">*</span></span>
                        <input type=text class="dataValueInput" data-key="${key}" old-value="" value=""  required>
                    </div>
                `;
        } else if (key === "slugCleaner") {
            return `
                    <div class="dataRow" id=row-${key}>
                        <span class="dataLabel" >${key}:</span>
                        <input type=text class="dataValueInput" data-key="${key}" old-value="" value=""  >
                    </div>
                `;
        } else if (key === "siteStructure") {
            return `
                <div class="dataRow" id="row-${key}">
                    <span class="dataLabel">${key}: <span style="color: red;">*</span></span>
                    <span class="dataLabel">infoPage:</span>
                    <input type=text class="dataValueInput" data-key="${key}" data-prop="infoPage" old-value="" value=""  required>
                    <span class="dataLabel">readingPage:</span>
                    <input type=text class="dataValueInput" data-key="${key}" data-prop="readingPage" old-value="" value=""  required>
                </div>
            `;
        } else { // for the info_... columns
            const key_name = key.replace("info_", "");
            return `
                <div class="dataRow" id=row-${key}>
                        <span class="dataLabel" >${key_name}</span>
                        <input type=text class="dataValueInput" data-key="${key}" old-value="" value="" data-prop="selector" placeholder="XPath Selector"  >
                        <span>takeFirst?</span> <input type=checkbox class="dataValueCheckbox" old-value="" data-key="${key}" data-prop="takeFirst">
                        <span>isArray?</span> <input type=checkbox class="dataValueCheckbox" old-value="" data-key="${key}" data-prop="isArray">
                        <span>El Filter</span> <input type=text class="dataValueInput" old-value="" data-key="${key}" data-prop="elementFilter" placeholder="None" >
                        <span>Content Filter</span> <input type=text class="dataValueInput" old-value="" data-key="${key}" data-prop="contentFilter" placeholder="None" >
                    </div>
                `;
        }
    }).join("");
}

function populateHtml(selectedWebsiteData) {
    const isNew = new URL(window.location).searchParams.has("new");

    document.querySelectorAll("#dataDisplay_Container input[type='text']").forEach((input) => {
        input.value = "";
        input.setAttribute("old-value", "");
    });
    document.querySelectorAll("#dataDisplay_Container input[type='checkbox']").forEach((input) => {
        input.checked = false;
        input.setAttribute("old-value", "false");
    });
    document.querySelectorAll("#dataDisplay_Container select").forEach((select) => {
        select.value = "";
        select.setAttribute("old-value", "");
    });
    document.querySelectorAll("#dataDisplay_Container .dataValue").forEach((span) => span.textContent = "");

    if (isNew) {
        const idSpan = document.querySelector(`.dataValue[data-key="id"]`);
        if (idSpan) idSpan.textContent = "?";
    };
    if (!selectedWebsiteData) return;

    Object.entries(selectedWebsiteData).forEach(([key, value]) => {
        if (value === null) value = "";

        if (key === "id") {
            const span = document.querySelector(`.dataValue[data-key="${key}"]`);
            if (span) span.textContent = value;
            return;
        }

        if (key === "websiteID") {
            const select = document.querySelector(`select[data-key="${key}"]`);
            if (select) {
                select.value = value;
                select.setAttribute("old-value", value);
            }
            return;
        }

        if (key === "siteStructure") {
            let structureObj = { infoPage: "", readingPage: "" };
            if (typeof value === "string" && value.trim().startsWith("{")) {
                try { structureObj = JSON.parse(value); } catch (e) { }
            } else if (typeof value === "object") {
                structureObj = { ...structureObj, ...value };
            }

            const infoInput = document.querySelector(`input[data-key="${key}"][data-prop="infoPage"]`);
            if (infoInput) {
                infoInput.value = structureObj.infoPage || "";
                infoInput.setAttribute("old-value", structureObj.infoPage || "");
            };

            const readInput = document.querySelector(`input[data-key="${key}"][data-prop="readingPage"]`);
            if (readInput) {
                readInput.value = structureObj.readingPage || "";
                readInput.setAttribute("old-value", structureObj.readingPage || "");
            };
            return;
        }

        if (key.startsWith("info_")) {
            let infoObj = { selector: "", takeFirst: false, isArray: false, elementFilter: "", contentFilter: "" };

            if (typeof value === "string" && value.trim().startsWith("{")) {
                try { infoObj = JSON.parse(value); } catch (e) { infoObj.selector = value; }
            } else if (typeof value === "object") {
                infoObj = { ...infoObj, ...value };
            } else {
                infoObj.selector = value;
            }

            const selectorInput = document.querySelector(`input[data-key="${key}"][data-prop="selector"]`);
            if (selectorInput) {
                selectorInput.value = infoObj.selector || "";
                selectorInput.setAttribute("old-value", infoObj.selector || "");
            }

            const checkbox = document.querySelector(`input[data-key="${key}"][data-prop="takeFirst"]`);
            if (checkbox) {
                checkbox.checked = !!infoObj.takeFirst;
                checkbox.setAttribute("old-value", !!infoObj.takeFirst);
            }

            const arrayCheckbox = document.querySelector(`input[data-key="${key}"][data-prop="isArray"]`);
            if (arrayCheckbox) {
                arrayCheckbox.checked = !!infoObj.isArray;
                arrayCheckbox.setAttribute("old-value", !!infoObj.isArray);
            }

            const elFilter = document.querySelector(`input[data-key="${key}"][data-prop="elementFilter"]`);
            if (elFilter) {
                elFilter.value = infoObj.elementFilter || "";
                elFilter.setAttribute("old-value", infoObj.elementFilter || "");
            }

            const contentFilter = document.querySelector(`input[data-key="${key}"][data-prop="contentFilter"]`);
            if (contentFilter) {
                contentFilter.value = infoObj.contentFilter || "";
                contentFilter.setAttribute("old-value", infoObj.contentFilter || "");
            }

            return;
        }

        const input = document.querySelector(`input[data-key="${key}"]:not([data-prop])`);
        if (input) {
            input.value = (typeof value === "object") ? JSON.stringify(value) : value;
            input.setAttribute("old-value", (typeof value === "object") ? JSON.stringify(value) : value);
        }
    });
}

function convertCssToXpath(css) {
    let s = css.trim();
    if (!s) return "";

    // 1. Convert structural CSS pseudo-classes to positional progressive predicates
    s = s.replace(/:first-child/g, '[1]');
    s = s.replace(/:last-child/g, '[last()]');
    s = s.replace(/:nth-child\((\d+)\)/g, '[$1]');

    // 2. Replace structural combinators
    s = s.replace(/\s*>\s*/g, "/");
    s = s.replace(/\s+/g, "//");

    // 3. Ensure baseline structural node selection prefix
    if (!s.startsWith("/")) {
        s = "//" + s;
    }

    // 4. Inject a wildcard '*' if a slash is immediately followed by a condition anchor (#, ., or [)
    s = s.replace(/\/\/([#\.\[])/g, "//*$1");
    s = s.replace(/\/([#\.\[])/g, "/*$1");

    // 5. Convert explicit ID matches (#identity) to valid predicates
    s = s.replace(/#([a-zA-Z0-9_-]+)/g, '[@id="$1"]');

    // 6. Convert explicit class definitions (.classname) to valid contains-class predicates
    s = s.replace(/\.([a-zA-Z0-9_-]+)/g, '[contains(concat(" ", normalize-space(@class), " "), " $1 ")]');

    return s;
}

function enableXPathConverter() {
    const cssInput = document.getElementById("cssInput");
    const convertBtn = document.getElementById("convertBtn");
    const pasteConvertCopyBtn = document.getElementById("pasteConvertCopyBtn");
    const xpathOutput = document.getElementById("xpathOutput");

    // Helper to run conversion and copy to clipboard
    function executionPipeline(cssValue, actionButton) {
        const xpathResult = convertCssToXpath(cssValue);

        if (xpathResult) {
            cssInput.value = cssValue; // Ensure the text field shows what was processed
            xpathOutput.textContent = xpathResult;

            navigator.clipboard.writeText(xpathResult).then(() => {
                const originalText = actionButton.textContent;
                actionButton.textContent = "Done! Copied";
                setTimeout(() => actionButton.textContent = originalText, 1500);
            });
        } else {
            xpathOutput.textContent = "Please input a valid CSS Selector string first.";
        }
    }

    // Standard manual Convert button
    if (convertBtn && cssInput) {
        convertBtn.addEventListener("click", () => {
            executionPipeline(cssInput.value, convertBtn);
        });
    }

    // NEW: 1-Click Paste, Convert & Copy button
    if (pasteConvertCopyBtn) {
        pasteConvertCopyBtn.addEventListener("click", async () => {
            try {
                // Reads whatever text is currently in the user's system clipboard
                const clipboardText = await navigator.clipboard.readText();
                if (clipboardText) {
                    executionPipeline(clipboardText, pasteConvertCopyBtn);
                } else {
                    xpathOutput.textContent = "Clipboard is empty or doesn't contain text.";
                }
            } catch (err) {
                console.error("Clipboard read blocked:", err);
                xpathOutput.textContent = "Error: Please allow clipboard permissions when prompted.";
            }
        });
    }
}

function cleanUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("new")) {
        const url = new URL(window.location);
        url.searchParams.delete("new");
        window.history.replaceState({}, "", url);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    cleanUrlParams();
    renderWebsiteDataEditor();
    enableXPathConverter();
})