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

// TODO : download cover checking (only pasted in, not checked yet)
async function downloadCover(url, bookmarkId) {
    if (!url || !url.startsWith("http")) return url;
    if (url.includes("localhost:3000/media/covers/")) return url;

    const BOOKMARK_DIR = path.join(__dirname, `media/covers/${bookmarkId}`);
    if (!existsSync(BOOKMARK_DIR))
        mkdirSync(BOOKMARK_DIR, { recursive: true });
    const filename = crypto.randomUUID() + ".jpg";
    const filePath = path.join(BOOKMARK_DIR, filename);

    const headers = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
        Referer: new URL(url).origin + "/",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    };

    try {
        const response = await axios({
            url,
            method: "GET",
            responseType: "stream",
            timeout: 10000,
            headers: headers,
        });
        const writer = createWriteStream(filePath);
        response.data.pipe(writer);
        return await new Promise((resolve, reject) => {
            writer.on("finish", () =>
                resolve(`http://localhost:3000/media/covers/${filename}`),
            );
            writer.on("error", (e) => reject(e));
        });
    } catch (e) {
        console.error(`❌ Failed to download cover [${url}]:`, e.message);
        return "";
    }
}


module.exports = {
    downloadFavicon,
    downloadCover
};