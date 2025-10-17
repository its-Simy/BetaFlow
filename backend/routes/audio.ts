import express, { Request, Response } from "express";
import { generateAudio } from "../services/elevenLabsSpeaker";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { text, voice = "Rachel" } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required for audio." });
  }

  try {
    const audioUrl = await generateAudio(text, voice);
    res.json({ audioUrl });
  } catch (err: any) {
    console.error("ElevenLabs audio failed:", err.message);
    res.status(500).json({ error: "Failed to generate audio." });
  }
});

export default router;