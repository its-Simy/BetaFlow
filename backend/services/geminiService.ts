import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface StockInsight {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  keyPoints: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: number;
}

export interface GeminiResponse {
  symbol?: string;
  generatedAt: string;
  insight: StockInsight;
  reasoning?: string;
}

export class GeminiService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private readonly model = 'gemini-2.5-flash';

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    console.log('GeminiService constructor - API key:', this.apiKey ? 'SET' : 'NOT SET');
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.warn('GEMINI_API_KEY not set - using mock responses');
    }
  }

  /**
   * Analyze stock based on news articles
   */
  async analyzeStock(symbol: string, newsContext: string): Promise<GeminiResponse> {
    // Return mock response if API key is not set
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.log('Using mock response for stock analysis:', symbol);
      try {
        return this.getMockStockResponse(symbol);
      } catch (error) {
        console.error('Mock response error:', error);
        throw error;
      }
    }

        // Use real API for specific analysis
        console.log('Using real Gemini API for stock analysis:', symbol);

    const prompt = this.buildStockAnalysisPrompt(symbol, newsContext);
    
    try {
      const response = await this.callGeminiAPI(prompt);
      const parsedResponse = this.parseGeminiResponse(response, symbol);
      
      return {
        symbol,
        generatedAt: new Date().toISOString(),
        insight: parsedResponse.insight,
        reasoning: parsedResponse.reasoning
      };
    } catch (error) {
      console.error('GeminiService.analyzeStock error:', error);
      throw new Error('Failed to analyze stock with Gemini AI');
    }
  }

  /**
   * Analyze free-text query
   */
  async analyzeQuery(query: string, newsContext?: string): Promise<GeminiResponse> {
    // Return mock response if API key is not set
    if (!this.apiKey || this.apiKey === 'your_gemini_api_key_here') {
      console.log('Using mock response for query analysis:', query);
      return this.getMockQueryResponse(query);
    }

    const prompt = this.buildQueryAnalysisPrompt(query, newsContext);
    
    try {
      const response = await this.callGeminiAPI(prompt);
      const parsedResponse = this.parseGeminiResponse(response);
      
      return {
        generatedAt: new Date().toISOString(),
        insight: parsedResponse.insight,
        reasoning: parsedResponse.reasoning
      };
    } catch (error) {
      console.error('GeminiService.analyzeQuery error:', error);
      throw new Error('Failed to analyze query with Gemini AI');
    }
  }

  /**
   * Build prompt for stock analysis
   */
  private buildStockAnalysisPrompt(symbol: string, newsContext: string): string {
    return `You are a financial analysis assistant. Analyze the stock ${symbol} based on the recent news articles below.

${newsContext}

Return ONLY valid JSON following this exact schema:
{
  "sentiment": "bullish|bearish|neutral",
  "recommendation": "BUY|HOLD|SELL", 
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "riskLevel": "Low|Medium|High",
  "confidence": 85,
  "reasoning": "Brief explanation of the analysis"
}

Rules:
- sentiment must be exactly "bullish", "bearish", or "neutral"
- recommendation must be exactly "BUY", "HOLD", or "SELL"
- riskLevel must be exactly "Low", "Medium", or "High"
- confidence must be a number between 0-100
- keyPoints should be 3-5 concise, actionable insights
- reasoning should be 1-2 sentences explaining your analysis
- Do not include any text outside the JSON object
- Base your analysis on the news articles provided

Return only the JSON object:`;
  }

  /**
   * Build prompt for free-text query analysis
   */
  private buildQueryAnalysisPrompt(query: string, newsContext?: string): string {
    const contextSection = newsContext ? `\n\nRecent news context:\n${newsContext}` : '';
    
    return `You are a financial analysis assistant. Answer this query: "${query}"${contextSection}

Return ONLY valid JSON following this exact schema:
{
  "sentiment": "bullish|bearish|neutral",
  "recommendation": "BUY|HOLD|SELL", 
  "keyPoints": ["point1", "point2", "point3", "point4", "point5"],
  "riskLevel": "Low|Medium|High",
  "confidence": 85,
  "reasoning": "Brief explanation of the analysis"
}

Rules:
- sentiment must be exactly "bullish", "bearish", or "neutral"
- recommendation must be exactly "BUY", "HOLD", or "SELL"
- riskLevel must be exactly "Low", "Medium", or "High"
- confidence must be a number between 0-100
- keyPoints should be 3-5 concise, actionable insights
- reasoning should be 1-2 sentences explaining your analysis
- Do not include any text outside the JSON object
- If the query is about a specific stock, focus on that stock
- If the query is general, provide broad market insights

Return only the JSON object:`;
  }

  /**
   * Call Gemini API
   */
  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    console.log('Calling Gemini API with URL:', url);
    console.log('Prompt length:', prompt.length);
    
    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 0.8,
        maxOutputTokens: 2000
      }
    };

    try {
      const response = await axios.post(url, requestBody, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (!response.data.candidates || !response.data.candidates[0]) {
        throw new Error('No response from Gemini API');
      }

      const content = response.data.candidates[0].content;
      if (!content || !content.parts || !content.parts[0]) {
        throw new Error('Invalid response format from Gemini API');
      }

      return content.parts[0].text;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Gemini API error:', error.response?.data || error.message);
        throw new Error(`Gemini API error: ${error.response?.status} ${error.response?.statusText}`);
      }
      throw error;
    }
  }

  /**
   * Parse Gemini response and validate JSON
   */
  private parseGeminiResponse(response: string, symbol?: string): {
    insight: StockInsight;
    reasoning?: string;
  } {
    try {
      // Clean up the response - remove any markdown formatting
      let cleanResponse = response.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Handle truncated JSON by attempting to fix common issues
      cleanResponse = this.fixTruncatedJson(cleanResponse);
      
      // If the fix resulted in an empty object, try a more aggressive fix
      if (cleanResponse.trim() === '{}') {
        cleanResponse = this.aggressiveJsonFix(response);
      }

      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      const requiredFields = ['sentiment', 'recommendation', 'keyPoints', 'riskLevel', 'confidence'];
      for (const field of requiredFields) {
        if (!(field in parsed)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate enum values
      if (!['bullish', 'bearish', 'neutral'].includes(parsed.sentiment)) {
        throw new Error(`Invalid sentiment: ${parsed.sentiment}`);
      }
      if (!['BUY', 'HOLD', 'SELL'].includes(parsed.recommendation)) {
        throw new Error(`Invalid recommendation: ${parsed.recommendation}`);
      }
      if (!['Low', 'Medium', 'High'].includes(parsed.riskLevel)) {
        throw new Error(`Invalid riskLevel: ${parsed.riskLevel}`);
      }
      if (typeof parsed.confidence !== 'number' || parsed.confidence < 0 || parsed.confidence > 100) {
        throw new Error(`Invalid confidence: ${parsed.confidence}`);
      }
      if (!Array.isArray(parsed.keyPoints) || parsed.keyPoints.length === 0) {
        throw new Error(`Invalid keyPoints: ${parsed.keyPoints}`);
      }

      return {
        insight: {
          sentiment: parsed.sentiment,
          recommendation: parsed.recommendation,
          keyPoints: parsed.keyPoints.slice(0, 5), // Limit to 5 points
          riskLevel: parsed.riskLevel,
          confidence: Math.round(parsed.confidence)
        },
        reasoning: parsed.reasoning
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      console.error('Raw response:', response);
      throw new Error('Failed to parse Gemini AI response');
    }
  }

  /**
   * Attempt to fix truncated JSON responses
   */
  private fixTruncatedJson(jsonString: string): string {
    try {
      // First, try to parse as-is
      JSON.parse(jsonString);
      return jsonString;
    } catch (error) {
      console.warn('JSON parsing failed, attempting to fix truncated response');
      
      // Common fixes for truncated JSON
      let fixed = jsonString;
      
      // If it ends with an incomplete string, try to close it
      if (fixed.match(/"[^"]*$/)) {
        fixed = fixed.replace(/"[^"]*$/, '""');
      }
      
      // If it ends with an incomplete array, try to close it
      if (fixed.match(/\[[^\]]*$/)) {
        fixed = fixed.replace(/\[[^\]]*$/, '[]');
      }
      
      // If it ends with an incomplete object, try to close it
      if (fixed.match(/\{[^}]*$/)) {
        fixed = fixed.replace(/\{[^}]*$/, '{}');
      }
      
      // Add missing closing braces/brackets
      const openBraces = (fixed.match(/\{/g) || []).length;
      const closeBraces = (fixed.match(/\}/g) || []).length;
      const openBrackets = (fixed.match(/\[/g) || []).length;
      const closeBrackets = (fixed.match(/\]/g) || []).length;
      
      // Add missing closing brackets first
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        fixed += ']';
      }
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        fixed += '}';
      }
      
      console.log('Attempted JSON fix:', fixed);
      return fixed;
    }
  }

  /**
   * More aggressive JSON fixing for severely truncated responses
   */
  private aggressiveJsonFix(response: string): string {
    console.warn('Attempting aggressive JSON fix for severely truncated response');
    
    // Extract what we can from the response
    const sentimentMatch = response.match(/"sentiment":\s*"([^"]+)"/);
    const recommendationMatch = response.match(/"recommendation":\s*"([^"]+)"/);
    const riskLevelMatch = response.match(/"riskLevel":\s*"([^"]+)"/);
    const confidenceMatch = response.match(/"confidence":\s*(\d+)/);
    
    // Extract key points (even if incomplete)
    const keyPointsMatch = response.match(/"keyPoints":\s*\[(.*?)(?:\]|$)/s);
    let keyPoints: string[] = [];
    
    if (keyPointsMatch) {
      const pointsText = keyPointsMatch[1];
      // Extract individual points
      const pointMatches = pointsText.match(/"([^"]*(?:[^"]*$)?)/g);
      if (pointMatches) {
        keyPoints = pointMatches.map(match => match.replace(/^"|"$/g, '')).filter(point => point.trim().length > 0);
      }
    }
    
    // If we couldn't extract key points, create some generic ones based on sentiment
    if (keyPoints.length === 0) {
      const sentiment = sentimentMatch ? sentimentMatch[1] : 'neutral';
      keyPoints = this.generateGenericKeyPoints(sentiment);
    }
    
    // Build a complete JSON response
    const fixedResponse = {
      sentiment: sentimentMatch ? sentimentMatch[1] : 'neutral',
      recommendation: recommendationMatch ? recommendationMatch[1] : 'HOLD',
      keyPoints: keyPoints.slice(0, 5), // Limit to 5 points
      riskLevel: riskLevelMatch ? riskLevelMatch[1] : 'Medium',
      confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 60,
      reasoning: 'Analysis based on available news data'
    };
    
    console.log('Aggressive fix result:', JSON.stringify(fixedResponse, null, 2));
    return JSON.stringify(fixedResponse);
  }

  /**
   * Generate generic key points based on sentiment
   */
  private generateGenericKeyPoints(sentiment: string): string[] {
    const genericPoints = {
      bullish: [
        'Recent positive market sentiment and growth indicators',
        'Strong fundamentals and competitive positioning',
        'Favorable industry trends and market conditions',
        'Positive analyst outlook and investor confidence',
        'Growth potential in key business segments'
      ],
      bearish: [
        'Market headwinds and challenging conditions',
        'Concerns about competitive positioning',
        'Industry challenges and regulatory pressures',
        'Mixed analyst sentiment and investor caution',
        'Risk factors affecting growth prospects'
      ],
      neutral: [
        'Mixed signals in recent market performance',
        'Balanced risk-reward profile for investors',
        'Industry trends showing both opportunities and challenges',
        'Analyst opinions divided on future prospects',
        'Market conditions requiring careful monitoring'
      ]
    };
    
    return genericPoints[sentiment as keyof typeof genericPoints] || genericPoints.neutral;
  }

  /**
   * Get mock response for stock analysis (when API key is not available)
   */
  private getMockStockResponse(symbol: string): GeminiResponse {
    console.log('getMockStockResponse called for:', symbol);
    const mockResponses = {
      'AAPL': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Strong iPhone sales driving revenue growth',
          'Services segment showing robust expansion',
          'AI integration in upcoming products',
          'Strong cash position and buyback program',
          'Market leadership in premium smartphone segment'
        ],
        riskLevel: 'Medium' as const,
        confidence: 85,
        reasoning: 'Based on recent earnings and market trends'
      },
      'NVDA': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'AI chip demand continues to surge',
          'Data center revenue growth accelerating',
          'Strong partnerships with major cloud providers',
          'Gaming segment showing resilience',
          'Leading position in AI hardware market'
        ],
        riskLevel: 'High' as const,
        confidence: 90,
        reasoning: 'AI market expansion driving strong fundamentals'
      },
      'TSLA': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'EV market competition increasing',
          'Strong delivery numbers in recent quarters',
          'Energy storage business growing',
          'Autonomous driving timeline uncertainty',
          'CEO statements affecting stock volatility'
        ],
        riskLevel: 'High' as const,
        confidence: 75,
        reasoning: 'Mixed signals from recent developments'
      },
      'MSFT': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Azure cloud services driving strong growth',
          'Office 365 subscription model providing steady revenue',
          'AI integration across product portfolio',
          'Strong enterprise customer base',
          'Windows 11 adoption supporting hardware sales'
        ],
        riskLevel: 'Medium' as const,
        confidence: 88,
        reasoning: 'Cloud and AI leadership with stable fundamentals'
      },
      'GOOGL': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Search advertising revenue remains strong',
          'YouTube monetization continues to grow',
          'Cloud services gaining market share',
          'AI capabilities across Google products',
          'Strong cash position for strategic investments'
        ],
        riskLevel: 'Medium' as const,
        confidence: 82,
        reasoning: 'Dominant search position with AI innovation'
      },
      'AMZN': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'AWS cloud services driving profitability',
          'E-commerce market leadership maintained',
          'Prime membership growth supporting revenue',
          'Logistics and fulfillment efficiency improvements',
          'Advertising revenue showing strong growth'
        ],
        riskLevel: 'Medium' as const,
        confidence: 80,
        reasoning: 'Cloud dominance with e-commerce recovery'
      },
      'META': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Metaverse investments impacting profitability',
          'Instagram and WhatsApp monetization growing',
          'AI integration across social platforms',
          'Regulatory challenges in key markets',
          'User engagement metrics showing mixed signals'
        ],
        riskLevel: 'High' as const,
        confidence: 70,
        reasoning: 'Strategic pivot with execution risks'
      },
      'HOOD': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Commission-free trading model gaining traction',
          'Cryptocurrency trading revenue growing',
          'Options trading volume increasing',
          'User base expansion in retail segment',
          'Strong brand recognition among younger investors'
        ],
        riskLevel: 'High' as const,
        confidence: 75,
        reasoning: 'Retail trading platform with growth potential'
      },
      'JPM': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Interest rate environment supporting net interest income',
          'Investment banking fees showing resilience',
          'Strong capital position and regulatory compliance',
          'Consumer banking segment performing well',
          'Market volatility impacting trading revenue'
        ],
        riskLevel: 'Medium' as const,
        confidence: 78,
        reasoning: 'Leading bank with mixed market conditions'
      },
      'BAC': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Net interest income benefiting from rate environment',
          'Consumer banking operations showing strength',
          'Investment banking fees under pressure',
          'Strong capital ratios and risk management',
          'Digital banking initiatives gaining traction'
        ],
        riskLevel: 'Medium' as const,
        confidence: 75,
        reasoning: 'Solid fundamentals with sector headwinds'
      },
      'WFC': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Net interest income growth from rate environment',
          'Consumer banking segment performing well',
          'Regulatory compliance improvements ongoing',
          'Cost reduction initiatives showing progress',
          'Market share recovery in key segments'
        ],
        riskLevel: 'Medium' as const,
        confidence: 72,
        reasoning: 'Recovery story with regulatory overhang'
      },
      'GS': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Investment banking fees under pressure',
          'Trading revenue showing volatility',
          'Asset management business providing stability',
          'Strong capital position and risk management',
          'Strategic initiatives in consumer banking'
        ],
        riskLevel: 'High' as const,
        confidence: 70,
        reasoning: 'Market-dependent revenue with execution challenges'
      },
      'C': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Net interest income benefiting from rates',
          'Consumer banking operations showing improvement',
          'Investment banking fees declining',
          'Strong capital position and regulatory compliance',
          'Digital transformation initiatives ongoing'
        ],
        riskLevel: 'Medium' as const,
        confidence: 73,
        reasoning: 'Recovery trajectory with market challenges'
      },
      'V': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Payment volume growth across all segments',
          'International expansion driving revenue',
          'Digital payment solutions gaining adoption',
          'Strong network effects and market position',
          'Consistent revenue growth and profitability'
        ],
        riskLevel: 'Low' as const,
        confidence: 85,
        reasoning: 'Payment network leadership with global growth'
      },
      'MA': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Payment volume growth in key markets',
          'Digital payment solutions expanding',
          'International market penetration increasing',
          'Strong brand recognition and network effects',
          'Consistent profitability and cash generation'
        ],
        riskLevel: 'Low' as const,
        confidence: 83,
        reasoning: 'Payment network dominance with growth opportunities'
      },
      'PYPL': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Digital payment adoption continuing to grow',
          'Venmo monetization strategies showing progress',
          'International expansion opportunities',
          'Competition from Apple Pay and Google Pay',
          'Cryptocurrency initiatives under development'
        ],
        riskLevel: 'Medium' as const,
        confidence: 68,
        reasoning: 'Digital payment leader facing increased competition'
      },
      'SQ': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Square payment processing volume growing',
          'Cash App user base expanding',
          'Bitcoin integration driving engagement',
          'Small business services showing resilience',
          'Competition in fintech space intensifying'
        ],
        riskLevel: 'High' as const,
        confidence: 65,
        reasoning: 'Fintech innovation with execution risks'
      },
      'COIN': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Cryptocurrency trading volume showing volatility',
          'Institutional adoption of crypto services',
          'Regulatory clarity improving in key markets',
          'Competition from traditional financial institutions',
          'Bitcoin price correlation affecting revenue'
        ],
        riskLevel: 'High' as const,
        confidence: 60,
        reasoning: 'Crypto market leader with regulatory uncertainty'
      }
    };

    const response = mockResponses[symbol as keyof typeof mockResponses] || {
      sentiment: 'neutral' as const,
      recommendation: 'HOLD' as const,
      keyPoints: [
        `${symbol} shows mixed signals in recent trading`,
        'Market conditions remain uncertain for this sector',
        'Consider monitoring for updates and earnings reports',
        'Evaluate based on fundamentals and technical analysis',
        'Risk management recommended given volatility'
      ],
      riskLevel: 'Medium' as const,
      confidence: 60,
      reasoning: 'Limited recent data available for analysis'
    };

    return {
      symbol,
      generatedAt: new Date().toISOString(),
      insight: response,
      reasoning: response.reasoning
    };
  }

  /**
   * Get mock response for query analysis (when API key is not available)
   */
  private getMockQueryResponse(query: string): GeminiResponse {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('apple') || lowerQuery.includes('aapl')) {
      return this.getMockStockResponse('AAPL');
    } else if (lowerQuery.includes('nvidia') || lowerQuery.includes('nvda')) {
      return this.getMockStockResponse('NVDA');
    } else if (lowerQuery.includes('tesla') || lowerQuery.includes('tsla')) {
      return this.getMockStockResponse('TSLA');
    } else if (lowerQuery.includes('dividend')) {
      return {
        generatedAt: new Date().toISOString(),
        insight: {
          sentiment: 'bullish' as const,
          recommendation: 'BUY' as const,
          keyPoints: [
            'Dividend stocks provide steady income',
            'Look for companies with consistent payout history',
            'Consider dividend yield vs growth balance',
            'Utilities and consumer staples are defensive',
            'REITs offer attractive yields in current environment'
          ],
          riskLevel: 'Low' as const,
          confidence: 80
        },
        reasoning: 'Dividend strategies provide stability in volatile markets'
      };
    } else {
      return {
        generatedAt: new Date().toISOString(),
        insight: {
          sentiment: 'neutral' as const,
          recommendation: 'HOLD' as const,
          keyPoints: [
            'Market conditions remain uncertain',
            'Consider diversified portfolio approach',
            'Monitor economic indicators closely',
            'Risk management is crucial',
            'Stay informed about market developments'
          ],
          riskLevel: 'Medium' as const,
          confidence: 65
        },
        reasoning: 'General market analysis based on current conditions'
      };
    }
  }
}
