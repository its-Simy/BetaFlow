import express, { Request, Response } from "express";
import { NewsService } from "../services/newsService";

const router = express.Router();
const newsService = new NewsService();

router.get("/", async (req: Request, res: Response) => {
  try {
    console.log("Fetching top headlines...");
    const articles = await newsService.getTopHeadlines({
      pageSize: 20,
      country: 'us'
    });
    console.log(`Found ${articles.length} articles`);
    res.json({ articles });
  } catch (err: any) {
    console.error("Error fetching news:", err.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;
