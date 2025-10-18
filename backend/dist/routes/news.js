"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fetchNews_1 = require("../services/fetchNews");
const router = express_1.default.Router();
router.get("/", async (req, res) => {
    try {
        const articles = await (0, fetchNews_1.fetchNews)();
        res.json({ articles });
    }
    catch (err) {
        console.error("Error fetching news:", err.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});
exports.default = router;
//# sourceMappingURL=news.js.map