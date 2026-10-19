export class Purify {
    static escapeHtml(value) {
        if (value === null || value === undefined) {
            return "";
        }
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#x27;")
            .replace(/\//g, "&#x2F;");
    }

    static unescapeHtml(value) {
        if (typeof value !== "string") return value;
        return value
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, "/");
    }

    static sanitizeObject(object) {
        if (!object || typeof object !== "object") {
            return object;
        }

        if (Array.isArray(object)) {
            return object.map(item => Purify.sanitizeObject(item));
        }

        return Object.fromEntries(
            Object.entries(object).map(([key, value]) => {
                if (typeof value === "string") {
                    return [key, Purify.escapeHtml(value)];
                } else if (value && typeof value === "object") {
                    return [key, Purify.sanitizeObject(value)];
                }
                return [key, value];
            })
        );
    }
}
