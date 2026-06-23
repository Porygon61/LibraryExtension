const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const { existsSync, mkdirSync, readFileSync } = require("fs");
const path = require("path");
const yaml = require("yaml");
const Logger = require("./utils/logger.js");

const app = express();

let PORT = 6767;
let dbFilename = "catzeLibrary.sqlite";
const CONFIG_PATH = path.join(__dirname, "config.yaml");
let config = {};
if (existsSync(CONFIG_PATH)) {
    try {
        config = yaml.parse(readFileSync(CONFIG_PATH, "utf-8"));
        if (config.settings?.port) PORT = config.settings.port;
        if (config.database?.filename) dbFilename = config.database.filename;
    } catch (e) {
        console.error("❌ Failed to parse config initially:", e.message);
    }
}

const DB_PATH = path.join(__dirname, "DB/" + dbFilename);
const COVERS_DIR = path.join(__dirname, "media/covers");
const FAVICONS_DIR = path.join(__dirname, "media/favicons");

const FRONTEND_DIR = path.join(__dirname, "../frontend/library/");

if (!existsSync(COVERS_DIR)) mkdirSync(COVERS_DIR, { recursive: true });
if (!existsSync(path.dirname(DB_PATH)))
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (!existsSync(FAVICONS_DIR)) mkdirSync(FAVICONS_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error("❌ Database connection error:", err.message);
    } else {
        db.run("PRAGMA journal_mode = WAL;");
        db.run("PRAGMA synchronous = NORMAL;");
        db.configure("busyTimeout", 5000);
        console.log(`✅ Connected to database: ${dbFilename}`);
    }
});

// Initialize Logger
const logger = new Logger(db);
logger.info("Server", "Logger initialized");

db.on("error", (err) => console.error("🔥 Global Database Error:", err));
app.use((err, req, res, next) => {
    console.error(
        `🔥 API Error on ${req.method} ${req.originalUrl}:`,
        err.message,
    );
    res.status(500).json({
        success: false,
        error: "Internal Server Error",
        details: err.message,
    });
});

const dbRun = (db, sql) =>
    new Promise((res, rej) => db.run(sql, (err) => (err ? rej(err) : res())));
const dbAll = (db, sql) =>
    new Promise((res, rej) =>
        db.all(sql, (err, rows) => (err ? rej(err) : res(rows))),
    );
syncTableSchema();


logAll();
// ROUTES
app.use("/covers", express.static(COVERS_DIR));
app.use("/favicons", express.static(FAVICONS_DIR));
app.use(express.static(FRONTEND_DIR));
app.use("/", require("./routes/home")(FRONTEND_DIR)); // serves static files (html frontend)

app.use("/system", require("./routes/system")(db, CONFIG_PATH));
app.use("/proxy", require("./routes/proxy")(db));
app.use("/library", require("./routes/library")(db));
app.use("/api", require("./routes/api")());
app.use("/mapping", require("./routes/mapping")(db, FAVICONS_DIR, COVERS_DIR, logger));
// ROUTES END

app.listen(PORT, () => console.log(`✅ Manga Backend Running on Port ${PORT}`));

process.on("uncaughtException", (err) =>
    console.error("🔥 UNCAUGHT EXCEPTION:", err),
);
process.on("unhandledRejection", (reason) =>
    console.error("🔥 UNHANDLED REJECTION:", reason),
);

// ------------------------------------------------------------
async function syncTableSchema() {
    if (!existsSync(CONFIG_PATH)) return;
    try {
        const tables = config.database?.tables;
        if (!tables) return;

        db.serialize(async () => {
            db.run("PRAGMA foreign_keys = ON");
            for (const [tableName, schema] of Object.entries(tables)) {
                const colDefs = [];
                const tableConstraints = [];

                for (const [key, value] of Object.entries(schema)) {
                    const cleanKey = key.trim();

                    // 1. Handle Composite Primary Keys
                    if (cleanKey === "primaryKey") {
                        const keys = Array.isArray(value)
                            ? value.join(", ")
                            : value;
                        tableConstraints.push(`PRIMARY KEY (${keys})`);
                    }
                    // 2. Handle Foreign Keys
                    else if (cleanKey.startsWith("FOREIGN KEY")) {
                        tableConstraints.push(`${cleanKey} ${value}`);
                    }
                    // 3. Handle Regular Columns
                    else {
                        colDefs.push(`"${cleanKey}" ${value}`);
                    }
                }

                const totalSchema = [...colDefs, ...tableConstraints].join(
                    ", ",
                );
                await dbRun(
                    db,
                    `CREATE TABLE IF NOT EXISTS ${tableName} (${totalSchema})`,
                );

                // 4. Add any missing columns
                try {
                    const existingCols = await dbAll(
                        db,
                        `PRAGMA table_info(${tableName})`,
                    );
                    const existingNames = existingCols.map((c) => c.name);

                    for (const [key, value] of Object.entries(schema)) {
                        const cleanKey = key.trim();
                        // Only add if it's an actual column definition and missing
                        if (
                            cleanKey !== "primaryKey" &&
                            !cleanKey.startsWith("FOREIGN KEY")
                        ) {
                            if (!existingNames.includes(cleanKey)) {
                                await dbRun(
                                    db,
                                    `ALTER TABLE ${tableName} ADD COLUMN "${cleanKey}" ${value}`,
                                );
                                console.log(
                                    `ℹ️ Migrated: Added column [${cleanKey}] to table [${tableName}]`,
                                );
                            }
                        }
                    }
                } catch (pragmaErr) {
                    console.error(
                        `❌ Failed to fetch structural details for ${tableName}:`,
                        pragmaErr.message,
                    );
                }
            }
        });
    } catch (e) {
        console.error("❌ Schema Error:", e.message);
    }
}

function logAll() {
    app.use((req, res, next) => {
        console.log(`📡 ${req.method} ${req.originalUrl} => ${res}`);
        next();
    });
}