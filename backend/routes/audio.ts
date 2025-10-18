import express, { Request, Response } from "express";
import { generateAudio } from "../services/elevenLabsSpeaker";

const router = express.Router();

router.post("/", async (req: Request, res: Response) => {
  const { text, voice = "Rachel" } = req.body;

  console.log("Audio generation request received:", { text: text?.substring(0, 100), voice });

  if (!text) {
    return res.status(400).json({ error: "Text is required for audio." });
  }

  try {
    const audioData = await generateAudio(text, voice);
    console.log("Audio generated successfully");
    res.json(audioData);
  } catch (err: any) {
    console.error("ElevenLabs audio failed:", err.message);
    console.error("Error details:", err.response?.data || err);
    res.status(500).json({ 
      error: "Failed to generate audio.",
      details: err.message 
    });
  }
});

export default router;