const express = require("express");

module.exports = (db) => {
    const router = express.Router();

    router.post("/search", (req, res) => {
        const { url } = req.body;
        const sql = `SELECT b.* FROM bookmarks b JOIN urls m ON b.id = m.bookmark_id WHERE m.url = ?`;
        db.get(sql, [url], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(row || null);
        });
    });

    router.delete("/entry", (req, res) => {
        const { id } = req.body;
        const sql = `DELETE FROM bookmarks WHERE id = ?`;
        db.run(sql, [id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true });
        });
    });

    return router;
};
