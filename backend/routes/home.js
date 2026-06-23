const express = require("express");
module.exports = (FRONTEND_DIR) => {
    const router = express.Router();

    router.get("/", (req, res) => {
        res.redirect("/home");
    });

    router.get("/home", (req, res) => {
        res.sendFile(FRONTEND_DIR + "/home/home.html");
    });

    router.get("/home/settings/websitesConfig", (req, res) => {
        res.sendFile(FRONTEND_DIR + "/settings/websitesConfiguration.html");
    });
    return router;
};