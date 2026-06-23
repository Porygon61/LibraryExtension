const express = require("express");
const { readFileSync, writeFileSync } = require("fs");
const yaml = require("yaml");

module.exports = (db, CONFIG_PATH) => {
    const router = express.Router();

    router.post("/log", (req, res) => {
        const { action, message, data } = req.body;
        db.run(`INSERT INTO logs (action, message, data) VALUES (?, ?, ?)`, [
            action,
            message,
            data ? JSON.stringify(data) : null,
        ]);
        res.json({ success: true });
    });

    router.get("/config", (req, res) => {
        const config = yaml.parse(readFileSync(CONFIG_PATH, "utf-8"));
        res.json(config);
    });

    router.get("/websitesConfig", (req, res) => {
        db.all(`SELECT * FROM websites`, (err, rows) => {
            if (err) {
                console.error(
                    "❌ Failed to fetch website config:",
                    err.message,
                );
                return res
                    .status(500)
                    .json({ success: false, error: "Database error" });
            }
            const config = {};
            rows.forEach((row) => {
                config[row.domain] = row;
            });
            res.json({
                success: true,
                data: config,
            });
        });
    });

    router.post("/websitesConfig", (req, res) => {
        const data = req.body;

        const columns = Object.keys(data);
        const placeholders = columns.map(() => "?").join(", ");
        const values = columns.map(col => data[col]);

        const query = `INSERT INTO websites (${columns.join(", ")}) VALUES (${placeholders})`;

        db.run(query, values, function (err) {
            if (err) {
                console.error("❌ Failed to create website config:", err.message);
                return res
                    .status(500)
                    .json({ success: false, error: "Database error" });
            }
            res.json({ success: true, message: "Website config created" });
        });
    });

    router.patch("/websitesConfig", (req, res) => {
        const { id, ...data } = req.body;

        if (!id) {
            return res
                .status(400)
                .json({ success: false, error: "ID is required for updates" });
        }

        // Build the UPDATE query dynamically
        const columns = Object.keys(data);
        const setClause = columns.map(col => `${col} = ?`).join(", ");
        const values = [...columns.map(col => data[col]), id];

        const query = `UPDATE websites SET ${setClause} WHERE id = ?`;

        db.run(query, values, function (err) {
            if (err) {
                console.error("❌ Failed to update website config:", err.message);
                return res
                    .status(500)
                    .json({ success: false, error: "Database error" });
            }
            res.json({ success: true, message: "Website config updated", changes: this.changes });
        });
    });



    return router;
};
