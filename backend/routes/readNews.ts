import express, { Request, Response } from "express";
import { summarizeNews } from "../services/geminiSummarizer";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { article } = req.body;

  if (!article) {
    return res.status(400).json({ error: "Article content is required." });
  }

  try {
    const summaryData = await summarizeNews(article);
    res.json(summaryData);
  } catch (err: any) {
    console.error("Gemini summarization failed:", err.message);
    res.status(500).json({ error: "Failed to summarize news." });
  }
});

export default router;