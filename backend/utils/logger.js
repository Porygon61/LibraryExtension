/**
 * Universal Logger - Logs to both console and database
 */

const LOG_LEVELS = {
    ERROR: { emoji: "❌", color: "red", level: 0 },
    WARN: { emoji: "⚠️", color: "yellow", level: 1 },
    INFO: { emoji: "ℹ️", color: "blue", level: 2 },
    SUCCESS: { emoji: "✅", color: "green", level: 3 },
    DEBUG: { emoji: "🔧", color: "gray", level: 4 },
};

class Logger {
    constructor(db) {
        this.db = db;
    }

    /**
     * Log a message to both console and database
     * @param {string} level - Log level (ERROR, WARN, INFO, SUCCESS, DEBUG)
     * @param {string} action - Action/category (e.g., "POST /mapping", "Database", "Auth")
     * @param {string} message - Log message
     * @param {object} data - Additional data to log
     */
    log(level, action, message, data = null) {
        const logConfig = LOG_LEVELS[level] || LOG_LEVELS.INFO;
        const timestamp = new Date().toISOString();
        
        // Console output
        const consoleMsg = `${logConfig.emoji} [${timestamp}] ${action}: ${message}`;
        if (data) {
            console[level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log"](
                consoleMsg,
                JSON.stringify(data, null, 2)
            );
        } else {
            console[level === "ERROR" ? "error" : level === "WARN" ? "warn" : "log"](consoleMsg);
        }

        // Database output
        if (this.db) {
            const sql = `INSERT INTO logs (action, message, data) VALUES (?, ?, ?)`;
            this.db.run(sql, [
                action,
                message,
                data ? JSON.stringify(data) : null
            ], (err) => {
                if (err) {
                    console.error("🔥 Failed to write to logs table:", err.message);
                }
            });
        }
    }

    error(action, message, data) {
        this.log("ERROR", action, message, data);
    }

    warn(action, message, data) {
        this.log("WARN", action, message, data);
    }

    info(action, message, data) {
        this.log("INFO", action, message, data);
    }

    success(action, message, data) {
        this.log("SUCCESS", action, message, data);
    }

    debug(action, message, data) {
        this.log("DEBUG", action, message, data);
    }
}

module.exports = Logger;
