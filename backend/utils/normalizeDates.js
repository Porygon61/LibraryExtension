const { DateTime } = require("luxon");
const chrono = require("chrono-node");

/**
 * Normalizes any date format (absolute or relative) into 'YYYY-MM-DD HH:mm:ss'
 * @param {string} inputStr - The raw date string from a scraper or user input
 * @returns {string} The formatted datetime string or 'N/A'
 */
export function normalizeDate(inputStr) {
    if (!inputStr || typeof inputStr !== "string") return "N/A";

    const trimmedInput = inputStr.trim();

    // 1. TRY LUXON FIRST (For standard, absolute dates)
    // Try ISO format first (e.g., "2026-06-20T18:54:00Z")
    let luxonDate = DateTime.fromISO(trimmedInput);

    // If not ISO, try fallback parsing mechanisms built into Luxon
    if (!luxonDate.isValid) {
        luxonDate =
            DateTime.fromRFC2822(trimmedInput) ||
            DateTime.fromHTTP(trimmedInput);
    }

    // If Luxon successfully parsed it, format and return it immediately
    if (luxonDate.isValid) {
        return luxonDate.toFormat("yyyy-MM-dd HH:mm:ss");
    }

    // 2. FALLBACK TO CHRONO (For relative/natural language text like "5h ago")
    try {
        const chronoJSDate = chrono.parseDate(trimmedInput);

        if (chronoJSDate) {
            // Chrono returns a native JS Date object; convert it to Luxon for clean formatting
            return DateTime.fromJSDate(chronoJSDate).toFormat(
                "yyyy-MM-dd HH:mm:ss",
            );
        }
    } catch (chronoError) {
        console.error(
            "Chrono failed to parse string:",
            trimmedInput,
            chronoError.message,
        );
    }

    // 3. FINAL FALLBACK
    return "N/A";
}
