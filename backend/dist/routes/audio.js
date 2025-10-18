"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const elevenLabsSpeaker_1 = require("../services/elevenLabsSpeaker");
const router = express_1.default.Router();
router.post("/", async (req, res) => {
    const { text, voice = "Rachel" } = req.body;
    console.log("Audio generation request received:", { text: text?.substring(0, 100), voice });
    if (!text) {
        return res.status(400).json({ error: "Text is required for audio." });
    }
    try {
        const audioData = await (0, elevenLabsSpeaker_1.generateAudio)(text, voice);
        console.log("Audio generated successfully");
        res.json(audioData);
    }
    catch (err) {
        console.error("ElevenLabs audio failed:", err.message);
        console.error("Error details:", err.response?.data || err);
        res.status(500).json({
            error: "Failed to generate audio.",
            details: err.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=audio.js.map