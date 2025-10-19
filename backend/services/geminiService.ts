import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface StockInsight {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  recommendation: 'BUY' | 'HOLD' | 'SELL';
  keyPoints: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  confidence: number; // 0-100
  reasoning?: string; // Optional reasoning field
}

export interface GeminiResponse {
  symbol?: string;
  query?: string;
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
    return `Analyze the stock ${symbol} based on the following recent news articles.
    Provide a sentiment (bullish, bearish, neutral), a recommendation (BUY, HOLD, SELL),
    5 key points, a risk level (Low, Medium, High), and a confidence score (0-100).
    Also provide a brief reasoning for the recommendation.

    Return only a JSON object with the following structure:
    {
      "insight": {
        "sentiment": "string", // bullish|bearish|neutral
        "recommendation": "string", // BUY|HOLD|SELL
        "keyPoints": ["string"],
        "riskLevel": "string", // Low|Medium|High
        "confidence": "number" // 0-100
      },
      "reasoning": "string"
    }

    News Context:
    ${newsContext}`;
  }

  /**
   * Build prompt for query analysis
   */
  private buildQueryAnalysisPrompt(query: string, newsContext?: string): string {
    const context = newsContext ? `\n\nRecent News:\n${newsContext}` : '';
    return `Analyze the following financial query and provide insights.
    ${query}
    ${context}

    Provide a sentiment (bullish, bearish, neutral), a recommendation (BUY, HOLD, SELL),
    5 key points, a risk level (Low, Medium, High), and a confidence score (0-100).
    Also provide a brief reasoning for the recommendation.

    Return only a JSON object with the following structure:
    {
      "insight": {
        "sentiment": "string", // bullish|bearish|neutral
        "recommendation": "string", // BUY|HOLD|SELL
        "keyPoints": ["string"],
        "riskLevel": "string", // Low|Medium|High
        "confidence": "number" // 0-100
      },
      "reasoning": "string"
    }

    Constraints:
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
      } else {
        console.error('Unknown error calling Gemini API:', error);
        throw new Error('Unknown error calling Gemini API');
      }
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

      // Validate required fields in the insight object
      const insight = parsed.insight || parsed;
      const requiredFields = ['sentiment', 'recommendation', 'keyPoints', 'riskLevel', 'confidence'];
      for (const field of requiredFields) {
        if (!(field in insight)) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate enum values
      if (!['bullish', 'bearish', 'neutral'].includes(insight.sentiment)) {
        throw new Error(`Invalid sentiment: ${insight.sentiment}`);
      }
      if (!['BUY', 'HOLD', 'SELL'].includes(insight.recommendation)) {
        throw new Error(`Invalid recommendation: ${insight.recommendation}`);
      }
      if (!['Low', 'Medium', 'High'].includes(insight.riskLevel)) {
        throw new Error(`Invalid riskLevel: ${insight.riskLevel}`);
      }
      if (typeof insight.confidence !== 'number' || insight.confidence < 0 || insight.confidence > 100) {
        throw new Error(`Invalid confidence: ${insight.confidence}`);
      }
      if (!Array.isArray(insight.keyPoints) || insight.keyPoints.length === 0) {
        throw new Error(`Invalid keyPoints: ${insight.keyPoints}`);
      }

      return {
        insight: {
          sentiment: insight.sentiment,
          recommendation: insight.recommendation,
          keyPoints: insight.keyPoints.slice(0, 5), // Limit to 5 points
          riskLevel: insight.riskLevel,
          confidence: Math.round(insight.confidence)
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
    const keyPointsMatch = response.match(/"keyPoints":\s*\[([\s\S]*?)(?:\]|$)/);
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
    const bullishPoints = [
      'Positive market sentiment and strong fundamentals',
      'Recent earnings showing growth potential',
      'Industry trends favoring the company',
      'Strong management and strategic initiatives',
      'Competitive advantages in the market'
    ];

    const bearishPoints = [
      'Market headwinds and challenging conditions',
      'Recent performance below expectations',
      'Industry disruption and competitive pressures',
      'Regulatory or economic concerns',
      'Management execution challenges'
    ];

    const neutralPoints = [
      'Mixed signals from recent developments',
      'Balanced risk-reward profile',
      'Market conditions creating uncertainty',
      'Company fundamentals remain stable',
      'Wait for clearer market direction'
    ];

    switch (sentiment.toLowerCase()) {
      case 'bullish': return bullishPoints;
      case 'bearish': return bearishPoints;
      default: return neutralPoints;
    }
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
        reasoning: 'Fintech innovation with execution challenges'
      },
      'COIN': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Cryptocurrency market volatility affecting trading volumes',
          'Institutional adoption continuing to grow',
          'Regulatory clarity improving in key markets',
          'Strong balance sheet and risk management',
          'Long-term crypto infrastructure play'
        ],
        riskLevel: 'High' as const,
        confidence: 60,
        reasoning: 'Crypto market exposure with regulatory risks'
      },
      'AMD': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Data center GPU demand surging with AI adoption',
          'EPYC server processors gaining market share',
          'Strong product roadmap and execution',
          'Competitive pricing against NVIDIA',
          'Growing partnerships with major cloud providers'
        ],
        riskLevel: 'High' as const,
        confidence: 82,
        reasoning: 'AI hardware growth with competitive positioning'
      },
      'INTC': {
        sentiment: 'neutral' as const,
        recommendation: 'HOLD' as const,
        keyPoints: [
          'Foundry business showing early progress',
          'Client computing segment stabilizing',
          'Data center competition intensifying',
          'Strategic partnerships in development',
          'Long-term turnaround story unfolding'
        ],
        riskLevel: 'High' as const,
        confidence: 55,
        reasoning: 'Transformation story with execution risks'
      },
      'NFLX': {
        sentiment: 'bullish' as const,
        recommendation: 'BUY' as const,
        keyPoints: [
          'Subscriber growth exceeding expectations',
          'Content investment driving engagement',
          'International expansion showing strong results',
          'Password sharing crackdown successful',
          'Advertising tier gaining traction'
        ],
        riskLevel: 'Medium' as const,
        confidence: 80,
        reasoning: 'Streaming leadership with content moat'
      }
    };

    const upperSymbol = symbol.toUpperCase();
    const mockData = mockResponses[upperSymbol as keyof typeof mockResponses];

    if (mockData) {
      return {
        symbol: upperSymbol,
        generatedAt: new Date().toISOString(),
        insight: mockData,
        reasoning: mockData.reasoning
      };
    }

    // Generic response for unknown symbols
    return {
      symbol: upperSymbol,
      generatedAt: new Date().toISOString(),
      insight: {
        sentiment: 'neutral',
        recommendation: 'HOLD',
        keyPoints: [
          'Limited recent news coverage for this symbol',
          'General market conditions apply',
          'Consider fundamental analysis',
          'Monitor for upcoming earnings or announcements',
          'Diversification recommended'
        ],
        riskLevel: 'Medium',
        confidence: 50,
        reasoning: 'Limited data available for analysis'
      },
      reasoning: 'Limited recent news coverage for this symbol'
    };
  }

  /**
   * Get mock response for query analysis (when API key is not available)
   */
  private getMockQueryResponse(query: string): GeminiResponse {
    console.log('getMockQueryResponse called for:', query);
    
    // Simple keyword-based mock responses
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('nvidia') || lowerQuery.includes('nvda')) {
      return {
        generatedAt: new Date().toISOString(),
        insight: {
          sentiment: 'bullish',
          recommendation: 'BUY',
          keyPoints: [
            'AI chip demand continues to surge globally',
            'Data center revenue growth accelerating',
            'Strong partnerships with major cloud providers',
            'Gaming segment showing resilience',
            'Leading position in AI hardware market'
          ],
          riskLevel: 'High',
          confidence: 90,
          reasoning: 'AI market expansion driving strong fundamentals'
        },
        reasoning: 'AI market expansion driving strong fundamentals'
      };
    }
    
    if (lowerQuery.includes('tesla') || lowerQuery.includes('tsla')) {
      return {
        generatedAt: new Date().toISOString(),
        insight: {
          sentiment: 'neutral',
          recommendation: 'HOLD',
          keyPoints: [
            'EV market competition increasing',
            'Strong delivery numbers in recent quarters',
            'Energy storage business growing',
            'Autonomous driving timeline uncertainty',
            'CEO statements affecting stock volatility'
          ],
          riskLevel: 'High',
          confidence: 75,
          reasoning: 'Mixed signals from recent developments'
        },
        reasoning: 'Mixed signals from recent developments'
      };
    }
    
    if (lowerQuery.includes('apple') || lowerQuery.includes('aapl')) {
      return {
        generatedAt: new Date().toISOString(),
        insight: {
          sentiment: 'bullish',
          recommendation: 'BUY',
          keyPoints: [
            'Strong iPhone sales driving revenue growth',
            'Services segment showing robust expansion',
            'AI integration in upcoming products',
            'Strong cash position and buyback program',
            'Market leadership in premium smartphone segment'
          ],
          riskLevel: 'Medium',
          confidence: 85,
          reasoning: 'Based on recent earnings and market trends'
        },
        reasoning: 'Based on recent earnings and market trends'
      };
    }
    
    // Generic response for other queries
    return {
      generatedAt: new Date().toISOString(),
      insight: {
        sentiment: 'neutral',
        recommendation: 'HOLD',
        keyPoints: [
          'Market conditions showing mixed signals',
          'Consider diversification strategies',
          'Monitor economic indicators',
          'Evaluate individual stock fundamentals',
          'Risk management is crucial'
        ],
        riskLevel: 'Medium',
        confidence: 60,
        reasoning: 'General market analysis based on current conditions'
      },
      reasoning: 'General market analysis based on current conditions'
    };
  }
}
