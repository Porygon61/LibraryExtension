const express = require("express");
const { downloadFavicon } = require("../utils/download.js");

module.exports = (db, FAVICONS_DIR, COVERS_DIR, logger) => {
    const router = express.Router();

    router.get("/", (req, res) => {
        const sql = `SELECT id, name, type FROM mapping ORDER BY name`;
        db.all(sql, (err, rows) => {
            if (err) {
                logger.error("GET /mapping", "Failed to fetch mapping", { error: err.message });
                return res.status(500).json({ error: err.message });
            }
            logger.debug("GET /mapping", "Fetched mapping entries", { count: rows?.length || 0 });
            res.json({ success: true, data: rows || [] });
        });
    });

    router.get("/websites", (req, res) => {
        const sql = `SELECT id, name, extraData FROM mapping WHERE type = 'website' ORDER BY name`;
        db.all(sql, (err, rows) => {
            if (err) {
                logger.error("GET /mapping/websites", "Failed to fetch websites", { error: err.message });
                return res.status(500).json({ error: err.message });
            }
            logger.debug("GET /mapping/websites", "Fetched website entries", { count: rows?.length || 0 });
            res.json({ success: true, data: rows || [] });
        });
    });

    router.post("/cover", (req, res) => {
        const { id } = req.body;
        const sql = `SELECT cover FROM mapping WHERE id = ?`;;
        db.get(sql, [id], (err, row) => {
            if (err) {
                logger.error("POST /mapping/cover", "Failed to fetch cover", { id, error: err.message });
                return res.status(500).json({ error: err.message });
            }
            logger.debug("POST /mapping/cover", "Fetched cover", { id });
            res.json(row || null);
        });
    });

    router.post("/", (req, res) => {
        const { name, type, extraData } = req.body;
        logger.info("POST /mapping", "Received request", { name, type, domain: extraData?.domain });

        if (extraData?.domain) {
            logger.info("POST /mapping", "Attempting favicon download", { domain: extraData.domain });
            downloadFavicon(extraData.domain, FAVICONS_DIR)
                .then((favicon) => {
                    const dataToInsert = { ...extraData, faviconUrl: favicon };
                    const sql = `INSERT INTO mapping (name, type, extraData) VALUES (?, ?, ?)`;
                    db.run(sql, [name, type, JSON.stringify(dataToInsert)], function (err) {
                        if (err) {
                            logger.error("POST /mapping", "Database insert failed", { name, type, error: err.message });
                            return res.status(500).json({ error: err.message });
                        }
                        logger.success("POST /mapping", "Entry created with favicon", { id: this.lastID, name, domain: extraData.domain, favicon });
                        res.json({ success: true, id: this.lastID });
                    });
                })
                .catch((err) => {
                    logger.warn("POST /mapping", "Favicon download failed, saving without favicon", { domain: extraData.domain, error: err.message });
                    const dataToInsert = { domain: extraData.domain };
                    const sql = `INSERT INTO mapping (name, type, extraData) VALUES (?, ?, ?)`;
                    db.run(sql, [name, type, JSON.stringify(dataToInsert)], function (err) {
                        if (err) {
                            logger.error("POST /mapping", "Database insert failed (no favicon)", { name, type, error: err.message });
                            return res.status(500).json({ error: err.message });
                        }
                        logger.success("POST /mapping", "Entry created without favicon", { id: this.lastID, name, domain: extraData.domain });
                        res.json({ success: true, warning: "Website added but favicon download failed", id: this.lastID });
                    });
                });
        } else {
            const sql = `INSERT INTO mapping (name, type, extraData) VALUES (?, ?, ?)`;
            db.run(sql, [name, type, JSON.stringify(extraData || {})], function (err) {
                if (err) {
                    logger.error("POST /mapping", "Database insert failed", { name, type, error: err.message });
                    return res.status(500).json({ error: err.message });
                }
                logger.success("POST /mapping", "Entry created", { id: this.lastID, name, type });
                res.json({ success: true, id: this.lastID });
            });
        }
    });

    return router;
}