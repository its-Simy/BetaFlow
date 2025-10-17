import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function summarizeNews(article: string) {
  const prompt = `
You are an expert news summarizer. Given the article below, perform the following tasks:
1. Summarize the key points in 3–5 sentences.
2. Highlight 3 important quotes or facts.
3. Analyze sentiment: list positive and negative reactions.
4. Structure insights into a table with key-value pairs.
5. If relevant, suggest a graph type and data points.

Article:
${article}
`;

  try {
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{ parts: [{ text: prompt }] }]
    });

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return { summary: text };
  } catch (err: any) {
    console.error("Gemini API error:", err.message);
    throw err;
  }
}