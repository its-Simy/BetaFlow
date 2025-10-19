import axios from "axios";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, "../../.env") });

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Rachel (default)
const voiceMap: Record<string, string> = {
  Rachel: "EXAVITQu4vr4xnSDxMaL",
  Domi: "AZnzlk1XvdvUeBnXmlld",
  // Add more voices if needed
};
export async function generateAudio(text: string, voiceName = "Rachel") {
  const voiceId = voiceMap[voiceName] || ELEVEN_VOICE_ID;  try {
    console.log("Generating audio for text:", text.substring(0, 100) + "...");
    console.log("Using API Key:", ELEVEN_API_KEY ? "Present" : "Missing");
    console.log("Using Voice ID:", voiceId);

    if (!ELEVEN_API_KEY) {
      throw new Error("ElevenLabs API key is missing");
    }

    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: text.substring(0, 5000), // Limit text length
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        },
        responseType: "arraybuffer",
        timeout: 30000
      }
    );

    console.log("Audio response received, size:", response.data.byteLength);

    if (response.data.byteLength === 0) {
      throw new Error("Empty audio response from ElevenLabs");
    }

    const audioBuffer = Buffer.from(response.data);
    const audioBase64 = audioBuffer.toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return { audioUrl };
  } catch (err: any) {
    console.error("ElevenLabs API error details:");
    console.error("Status:", err.response?.status);
    console.error("Status Text:", err.response?.statusText);
    console.error("Response Data:", err.response?.data);
    console.error("Full Error:", err.message);
    throw err;
  }
}