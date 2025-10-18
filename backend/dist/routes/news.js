"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const newsService_1 = require("../services/newsService");
const router = express_1.default.Router();
const newsService = new newsService_1.NewsService();
router.get("/", async (req, res) => {
    try {
        const articles = await newsService.getTopHeadlines({
            category: 'business',
            pageSize: 20
        });
        res.json({ articles });
    }
    catch (err) {
        console.error("Error fetching news:", err.message);
        res.status(500).json({ error: "Failed to fetch news" });
    }
});
exports.default = router;
//# sourceMappingURL=news.js.map