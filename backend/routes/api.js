const express = require("express");

module.exports = () => {
    const router = express.Router();

    router.head("/ping", (req, res) => {
        res.status(200).end();
    });

    return router;
}