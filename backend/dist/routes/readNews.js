"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const geminiSummarizer_1 = require("../services/geminiSummarizer");
const router = express_1.default.Router();
router.post("/", async (req, res) => {
    const { article } = req.body;
    if (!article) {
        return res.status(400).json({ error: "Article content is required." });
    }
    try {
        const summaryData = await (0, geminiSummarizer_1.summarizeNews)(article);
        res.json(summaryData);
    }
    catch (err) {
        console.error("Gemini summarization failed:", err.message);
        res.status(500).json({ error: "Failed to summarize news." });
    }
});
exports.default = router;
//# sourceMappingURL=readNews.js.map