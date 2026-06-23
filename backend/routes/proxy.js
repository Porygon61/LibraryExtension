const express = require("express");
const axios = require("axios");

module.exports = (db) => {
    const router = express.Router();

    router.get("/image", async (req, res) => {
        const imageUrl = req.query.url;
        if (!imageUrl || imageUrl === "undefined")
            return res.status(400).send("No valid URL");

        try {
            const response = await axios({
                url: imageUrl,
                method: "GET",
                responseType: "stream",
                timeout: 15000,
                headers: {
                    "User-Agent": "Mozilla/5.0",
                    Referer: new URL(imageUrl).origin + "/",
                },
            });
            response.data.pipe(res);
        } catch (error) {
            res.status(404).send("Proxy failed");
        }
    });

    router.get("/html", async (req, res) => {
        try {
            const response = await axios({
                url: req.query.url,
                method: "GET",
                timeout: 15000,
            });
            res.send(response.data);
        } catch (error) {
            res.status(404).send("HTML Proxy failed");
        }
    });

    return router;
};
