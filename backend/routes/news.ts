import express, { Request, Response } from "express";
import { fetchNews } from "../services/fetchNews";

const router = express.Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const articles = await fetchNews();
    res.json({ articles });
  } catch (err: any) {
    console.error("Error fetching news:", err.message);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

export default router;