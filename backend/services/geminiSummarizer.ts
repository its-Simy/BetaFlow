import axios from "axios";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-latest:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function summarizeNews(article: string) {
  const prompt = `Analyze this news article and provide a structured summary with these exact sections:

MAIN POINTS:
• Provide 4-6 key bullet points about the main facts and events
• Keep each point concise (under 100 characters)
• Focus on factual information

KEY IMPACTS:
• List 2-3 bullet points about market/financial implications
• Mention any sector or stock-specific impacts
• Keep each point concise

SENTIMENT:
• State the overall sentiment (positive/negative/neutral) in one word

Article: ${article}

Please respond ONLY with the structured format above. Do not add any additional explanations or sections.`;

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      {
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error("No response from Gemini API");
    }

    // Parse the structured response
    return parseStructuredResponse(text);
  } catch (err: any) {
    console.error("Gemini API error:", err.message);
    
    // Fallback response if API fails
    return getFallbackResponse(article);
  }
}

// Helper function to parse the structured response
function parseStructuredResponse(text: string) {
  const lines = text.split('\n').filter(line => line.trim());
  
  const mainPoints: string[] = [];
  const keyImpacts: string[] = [];
  let sentiment = 'neutral';

  let currentSection = '';

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Detect section headers
    if (trimmedLine.includes('MAIN POINTS') || trimmedLine.match(/^main points:/i)) {
      currentSection = 'mainPoints';
      continue;
    } else if (trimmedLine.includes('KEY IMPACTS') || trimmedLine.match(/^key impacts:/i)) {
      currentSection = 'keyImpacts';
      continue;
    } else if (trimmedLine.includes('SENTIMENT') || trimmedLine.match(/^sentiment:/i)) {
      currentSection = 'sentiment';
      continue;
    }

    // Extract bullet points
    if ((trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) && trimmedLine.length > 2) {
      const point = trimmedLine.substring(1).trim();
      
      if (currentSection === 'mainPoints' && point && mainPoints.length < 6) {
        mainPoints.push(point);
      } else if (currentSection === 'keyImpacts' && point && keyImpacts.length < 3) {
        keyImpacts.push(point);
      }
    } 
    // Extract sentiment from sentiment section
    else if (currentSection === 'sentiment') {
      const sentimentMatch = trimmedLine.toLowerCase().match(/(positive|negative|neutral)/);
      if (sentimentMatch) {
        sentiment = sentimentMatch[0];
        break; // Stop after finding sentiment
      }
    }
  }

  // Ensure we have at least some content
  if (mainPoints.length === 0) {
    // Fallback: use first few sentences as main points
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    mainPoints.push(...sentences.slice(0, 4).map(s => s.trim().substring(0, 100)));
  }

  if (keyImpacts.length === 0) {
    keyImpacts.push('Potential market implications to consider');
  }

  return {
    mainPoints: mainPoints.slice(0, 6), // Max 6 points
    keyImpacts: keyImpacts.slice(0, 3), // Max 3 impacts
    sentiment: sentiment || 'neutral'
  };
}

// Fallback response when API fails
function getFallbackResponse(article: string) {
  const sentences = article.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  return {
    mainPoints: sentences.slice(0, 4).map(s => s.trim().substring(0, 100)) || [
      'Key information from the news article',
      'Important details about the event',
      'Relevant facts and context'
    ],
    keyImpacts: [
      'Market implications to consider',
      'Potential sector-wide effects'
    ],
    sentiment: 'neutral'
  };
}