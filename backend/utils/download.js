const axios = require("axios");
const { createWriteStream, existsSync } = require("fs");
const path = require("path");
const crypto = require("crypto");


async function downloadFavicon(url, FAVICONS_DIR) {
    try {
        const domain = url.startsWith("http") ? new URL(url).hostname : url;
        const filename = crypto.randomUUID() + `.png`;
        const filePath = path.join(FAVICONS_DIR, filename);
        if (existsSync(filePath)) return `/favicons/${filename}`;

        const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
        const response = await axios({
            url: iconUrl,
            method: "GET",
            responseType: "stream",
        });
        const writer = createWriteStream(filePath);
        response.data.pipe(writer);
        return new Promise((resolve) => {
            writer.on("finish", () => resolve(`/favicons/${filename}`));
            writer.on("error", () => resolve(null));
        });
    } catch (e) {
        return null;
    }
}


module.exports = {
    downloadFavicon,
};