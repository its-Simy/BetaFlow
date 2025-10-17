import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;
const ELEVEN_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"; // Rachel (default)

export async function generateAudio(text: string, voiceId = ELEVEN_VOICE_ID) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      {
        headers: {
          "xi-api-key": ELEVEN_API_KEY,
          "Content-Type": "application/json"
        },
        responseType: "arraybuffer"
      }
    );

    // You can either stream this or save it as a file
    const audioBuffer = Buffer.from(response.data, "binary");
    const audioBase64 = audioBuffer.toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    return { audioUrl };
  } catch (err: any) {
    console.error("ElevenLabs API error:", err.message);
    throw err;
  }
}