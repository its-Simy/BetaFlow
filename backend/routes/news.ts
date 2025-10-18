import express, { Request, Response } from "express";
import { NewsService } from "../services/newsService";

const router = express.Router();
const newsService = new NewsService();

router.get("/", async (req: Request, res: Response) => {
  try {
    const articles = await newsService.getTopHeadlines({
      category: 'business',
      pageSize: 20
    });
    res.json({ articles });
  } catch (err: any) {
    console.error("Error fetching news:", err.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;
