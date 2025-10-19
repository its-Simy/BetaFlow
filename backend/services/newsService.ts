import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string | null;
  source: {
    name: string;
  };
  publishedAt: string;
  audioAvailable: boolean;
}

export interface NewsSearchParams {
  query?: string;
  category?: string;
  country?: string;
  pageSize?: number;
  from?: string;
  to?: string;
}

export class NewsService {
  private readonly newsApiKey: string;
  private readonly worldNewsApiKey: string;
  private readonly newsApiBaseUrl = 'https://newsapi.org/v2';
  private readonly worldNewsApiBaseUrl = 'https://api.worldnewsapi.com';

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY || '';
    this.worldNewsApiKey = process.env.WORLD_NEWS_API_KEY || '';

    if (!this.newsApiKey || this.newsApiKey === 'your_news_api_key_here') {
      console.warn('NEWS_API_KEY not set - will try World News API fallback');
    }
    if (!this.worldNewsApiKey || this.worldNewsApiKey === 'your_world_news_api_key_here') {
      console.warn('WORLD_NEWS_API_KEY not set - will use mock data as final fallback');
    }
  }

  /**
   * Search for news articles with optional filters
   */
  async searchNews(params: NewsSearchParams): Promise<NewsArticle[]> {
    // Try News API first
    if (this.newsApiKey && this.newsApiKey !== 'your_news_api_key_here') {
      try {
        const articles = await this.searchWithNewsAPI(params);
        if (articles.length > 0) {
          console.log(`News API returned ${articles.length} articles`);
          return articles;
        }
      } catch (error: unknown) {
        console.warn('News API failed, trying World News API:', error instanceof Error ? error.message : String(error));
      }
    }

    // Try World News API as fallback
    if (this.worldNewsApiKey && this.worldNewsApiKey !== 'your_world_news_api_key_here') {
      try {
        const articles = await this.searchWithWorldNewsAPI(params);
        if (articles.length > 0) {
          console.log(`World News API returned ${articles.length} articles`);
          return articles;
        }
      } catch (error: unknown) {
        console.warn('World News API failed, using mock data:', error instanceof Error ? error.message : String(error));
      }
    }

    // Final fallback to mock data
    console.log('All APIs failed, using mock news data');
    return this.getMockNews(params.query || 'general');
  }

  /**
   * Search using News API
   */
  private async searchWithNewsAPI(params: NewsSearchParams): Promise<NewsArticle[]> {
    const searchParams = new URLSearchParams({
      apiKey: this.newsApiKey,
      pageSize: Math.min(params.pageSize || 10, 100).toString(),
      language: 'en',
      sortBy: 'publishedAt'
    });

    if (params.query) {
      searchParams.append('q', params.query);
    }
    if (params.country) {
      searchParams.append('country', params.country);
    }
    if (params.category) {
      searchParams.append('category', params.category);
    }
    if (params.from) {
      searchParams.append('from', params.from);
    }
    if (params.to) {
      searchParams.append('to', params.to);
    }

    const response = await axios.get(`${this.newsApiBaseUrl}/everything?${searchParams}`);

    if (response.data.status !== 'ok') {
      throw new Error(`News API error: ${response.data.message}`);
    }

    return this.normalizeArticles(response.data.articles || []);
  }

  /**
   * Search using World News API
   */
  private async searchWithWorldNewsAPI(params: NewsSearchParams): Promise<NewsArticle[]> {
    const searchParams = new URLSearchParams({
      'api-key': this.worldNewsApiKey,
      'number': Math.min(params.pageSize || 10, 50).toString(),
      'language': 'en',
      'sort': 'publish-time',
      'sort-direction': 'DESC'
    });

    if (params.query) {
      searchParams.append('text', params.query);
    }
    if (params.from) {
      searchParams.append('earliest-publish-date', params.from);
    }
    if (params.to) {
      searchParams.append('latest-publish-date', params.to);
    }

    const response = await axios.get(`${this.worldNewsApiBaseUrl}/search-news?${searchParams}`);

    if (!response.data || !response.data.news) {
      throw new Error('World News API returned invalid response');
    }

    return this.normalizeWorldNewsArticles(response.data.news || []);
  }

  /**
   * Get top headlines for a specific category
   */
  async getTopHeadlines(params: {
    category?: string;
    country?: string;
    pageSize?: number;
  }): Promise<NewsArticle[]> {
    // Try News API first
    if (this.newsApiKey && this.newsApiKey !== 'your_news_api_key_here') {
      try {
        const searchParams = new URLSearchParams({
          apiKey: this.newsApiKey,
          pageSize: Math.min(params.pageSize || 10, 100).toString(),
          language: 'en',
          country: params.country || 'us'
        });

        if (params.category) {
          searchParams.append('category', params.category);
        }

        const response = await axios.get(`${this.newsApiBaseUrl}/top-headlines?${searchParams}`);

        if (response.data.status === 'ok' && response.data.articles?.length > 0) {
          console.log(`News API headlines returned ${response.data.articles.length} articles`);
          return this.normalizeArticles(response.data.articles);
        }
      } catch (error: unknown) {
        console.warn('News API headlines failed, trying World News API:', error instanceof Error ? error.message : String(error));
      }
    }

    // Try World News API as fallback
    if (this.worldNewsApiKey && this.worldNewsApiKey !== 'your_world_news_api_key_here') {
      try {
        const articles = await this.searchWithWorldNewsAPI({
          query: params.category || 'news',
          pageSize: params.pageSize || 10
        });
        if (articles.length > 0) {
          console.log(`World News API headlines returned ${articles.length} articles`);
          return articles;
        }
      } catch (error: unknown) {
        console.warn('World News API headlines failed, using mock data:', error instanceof Error ? error.message : String(error));
      }
    }

    // Final fallback to mock data
    console.log('All headline APIs failed, using mock news data');
    return this.getMockNews(params.category || 'general');
  }

  /**
   * Search for news about a specific stock symbol
   */
  async searchStockNews(symbol: string, lookbackDays: number = 7): Promise<NewsArticle[]> {
    const upperSymbol = symbol.toUpperCase();
    
    // If we have specific mock data for this symbol, return it directly
    if (upperSymbol === 'AAPL' || upperSymbol === 'TSLA' || upperSymbol === 'NVDA' || upperSymbol === 'INTC') {
      console.log(`Using specific mock news for ${upperSymbol}`);
      return this.getMockNews(upperSymbol);
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - lookbackDays);

    // Create search queries for the stock symbol
    const queries = [
      symbol,
      `${symbol} stock`,
      `${symbol} earnings`,
      `${symbol} financial`
    ];

    const allArticles: NewsArticle[] = [];

    for (const query of queries) {
      try {
        const articles = await this.searchNews({
          query,
          pageSize: 5,
          from: fromDate.toISOString().split('T')[0]
        });
        allArticles.push(...articles);
      } catch (error) {
        console.warn(`Failed to search for "${query}":`, error);
      }
    }

    return this.deduplicateArticles(allArticles);
  }

  /**
   * Normalize articles to ensure consistent structure (for News API)
   */
  private normalizeArticles(articles: any[]): NewsArticle[] {
    return articles
      .filter(article => article && article.title && article.url)
      .map(article => ({
        title: article.title || '',
        description: article.description || '',
        url: article.url || '',
        urlToImage: article.urlToImage,
        source: {
          name: article.source?.name || 'Unknown'
        },
        publishedAt: article.publishedAt || new Date().toISOString(),
        audioAvailable: true
      }));
  }

  /**
   * Normalize World News API articles to our format
   */
  private normalizeWorldNewsArticles(articles: any[]): NewsArticle[] {
    return articles
      .filter(article => article && article.title && article.url)
      .map(article => ({
        title: article.title || '',
        description: article.text || article.summary || '',
        url: article.url || '',
        urlToImage: article.image || null,
        source: {
          name: article.source?.name || 'World News API'
        },
        publishedAt: article.publish_date || new Date().toISOString(),
        audioAvailable: true
      }));
  }

  /**
   * Remove duplicate articles based on URL
   */
  private deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set<string>();
    return articles.filter(article => {
      if (seen.has(article.url)) {
        return false;
      }
      seen.add(article.url);
      return true;
    });
  }

  /**
   * Get mock news data when API key is not available
   */
  private getMockNews(query: string): NewsArticle[] {
    // Generate company name from ticker if it's a short ticker
    const companyName = this.getCompanyNameFromTicker(query);
    const upperQuery = query.toUpperCase();

    // Return specific mock news for known tickers, otherwise generic news
    if (upperQuery === 'AAPL') {
      return [
        {
          title: "Apple Reports Strong Q4 Earnings with iPhone 15 Sales Surge",
          description: "Apple Inc. reported better-than-expected fourth quarter earnings, driven by strong iPhone 15 sales and robust services revenue growth. The company's revenue increased 6% year-over-year to $94.8 billion.",
          url: "https://www.bloomberg.com/news/articles/apple-q4-earnings-iphone-15-sales",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Bloomberg' },
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Apple Unveils New MacBook Pro with M4 Chip Targeting Creative Professionals",
          description: "Apple introduced its latest MacBook Pro models featuring the powerful M4 chip, targeting creative professionals with enhanced performance and battery life. The announcement has generated positive buzz in the tech industry.",
          url: "https://www.cnbc.com/2025/10/18/apple-macbook-pro-m4-chip.html",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'CNBC' },
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Analysts Upgrade Apple Rating Following Strong Fundamentals",
          description: "Major investment firms have upgraded their ratings for Apple Inc. based on strong fundamentals, robust cash position, and growth prospects in the services segment.",
          url: "https://www.reuters.com/business/finance/apple-analyst-upgrade",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Reuters' },
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Apple's Services Revenue Hits Record High in Q4",
          description: "Apple's services segment, including App Store, iCloud, and Apple Music, reached a record $22.3 billion in revenue, up 16% from the previous year, demonstrating strong ecosystem growth.",
          url: "https://www.wsj.com/articles/apple-services-revenue-record",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Wall Street Journal' },
          publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Apple Stock Gains on Strong China Market Recovery",
          description: "Apple shares rose 3.2% following reports of strong iPhone sales recovery in China, with the company regaining market share in the premium smartphone segment.",
          url: "https://finance.yahoo.com/news/apple-china-recovery-stock-gains",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Yahoo Finance' },
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        }
      ];
    }

    if (upperQuery === 'TSLA') {
      return [
        {
          title: "Tesla Q3 Earnings Beat Expectations Despite EV Market Competition",
          description: "Tesla announced better-than-expected third-quarter earnings, driven by increased vehicle deliveries and improved profit margins. However, concerns about intensifying competition in the electric vehicle market continue.",
          url: "https://www.reuters.com/business/autos/tesla-q3-earnings-competition",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Reuters' },
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Tesla Cybertruck Production Ramp-Up Shows Progress",
          description: "Tesla's Cybertruck production is showing signs of acceleration, with the company reporting improved manufacturing efficiency and delivery timelines for its highly anticipated electric pickup truck.",
          url: "https://www.cnbc.com/2025/10/18/tesla-cybertruck-production-update",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'CNBC' },
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Tesla Energy Storage Business Shows Strong Growth",
          description: "Tesla's energy storage division reported significant growth, with Megapack installations increasing 40% year-over-year, positioning the company as a leader in grid-scale battery storage.",
          url: "https://www.bloomberg.com/news/articles/tesla-energy-storage-growth",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Bloomberg' },
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Tesla FSD Beta Shows Improved Performance in Latest Update",
          description: "Tesla's Full Self-Driving Beta software update shows improved performance metrics, with reduced disengagement rates and better handling of complex driving scenarios.",
          url: "https://www.techcrunch.com/2025/10/18/tesla-fsd-beta-update",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'TechCrunch' },
          publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Tesla Gigafactory Expansion Plans Announced for 2025",
          description: "Tesla announced plans to expand its Gigafactory network, with new facilities planned in Texas and Nevada to support increased production capacity for Model Y and Cybertruck.",
          url: "https://www.wsj.com/articles/tesla-gigafactory-expansion-2025",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Wall Street Journal' },
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        }
      ];
    }

    if (upperQuery === 'NVDA') {
      return [
        {
          title: "NVIDIA Stock Surges on Strong AI Chip Demand",
          description: "NVIDIA's stock price experienced a significant increase following reports of robust demand for its AI-focused graphics processing units (GPUs). The company's data center segment continues to be a primary growth driver.",
          url: "https://www.bloomberg.com/news/articles/nvidia-ai-chip-demand-surge",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Bloomberg' },
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "NVIDIA Partners with Major Cloud Providers for AI Infrastructure",
          description: "NVIDIA announced new partnerships with Amazon Web Services, Microsoft Azure, and Google Cloud to expand AI infrastructure capabilities, strengthening its position in the cloud computing market.",
          url: "https://www.cnbc.com/2025/10/18/nvidia-cloud-partnerships-ai",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'CNBC' },
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "NVIDIA Gaming Segment Shows Resilience Despite Market Challenges",
          description: "NVIDIA's gaming division reported stable revenue despite broader PC market headwinds, with strong demand for RTX 40-series graphics cards driving continued growth.",
          url: "https://www.reuters.com/business/technology/nvidia-gaming-resilience",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Reuters' },
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "NVIDIA Announces Next-Generation AI Chips for 2025",
          description: "NVIDIA unveiled its roadmap for next-generation AI chips, including the H200 and upcoming Blackwell architecture, promising significant performance improvements for AI workloads.",
          url: "https://www.techcrunch.com/2025/10/18/nvidia-next-gen-ai-chips",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'TechCrunch' },
          publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "NVIDIA Data Center Revenue Up 409% Year-Over-Year",
          description: "NVIDIA's data center revenue reached $14.5 billion in the latest quarter, up 409% from the previous year, driven by explosive demand for AI training and inference workloads.",
          url: "https://finance.yahoo.com/news/nvidia-data-center-revenue-growth",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Yahoo Finance' },
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        }
      ];
    }

    if (upperQuery === 'INTC') {
      return [
        {
          title: "Intel Reports Q3 Earnings with Strong Data Center Growth",
          description: "Intel Corporation reported third-quarter earnings that exceeded expectations, driven by strong performance in the data center segment and improved manufacturing efficiency. Revenue increased 8% year-over-year to $14.2 billion.",
          url: "https://www.bloomberg.com/news/articles/intel-q3-earnings-data-center-growth",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Bloomberg' },
          publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Intel's IDM 2.0 Strategy Shows Progress with Foundry Partnerships",
          description: "Intel's Integrated Device Manufacturing 2.0 strategy is gaining momentum with new foundry partnerships announced. The company is positioning itself to compete more effectively in the semiconductor manufacturing space.",
          url: "https://www.cnbc.com/2025/10/18/intel-idm-2-0-foundry-partnerships.html",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'CNBC' },
          publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Intel Arc GPU Line Shows Improved Performance in Latest Benchmarks",
          description: "Intel's Arc graphics card lineup has shown significant performance improvements in recent benchmarks, with the company making strides in the competitive GPU market against NVIDIA and AMD.",
          url: "https://www.reuters.com/technology/intel-arc-gpu-performance-improvements",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Reuters' },
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Intel Invests $20 Billion in New Semiconductor Manufacturing Facility",
          description: "Intel announced a $20 billion investment in a new semiconductor manufacturing facility, part of its strategy to regain leadership in chip manufacturing and reduce dependence on external foundries.",
          url: "https://www.wsj.com/articles/intel-20-billion-manufacturing-facility",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Wall Street Journal' },
          publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        },
        {
          title: "Intel Stock Gains on Strong AI and Data Center Demand",
          description: "Intel shares rose 4.1% following reports of strong demand for AI-optimized processors and data center solutions, with the company benefiting from the ongoing digital transformation trends.",
          url: "https://finance.yahoo.com/news/intel-ai-data-center-demand-stock-gains",
          urlToImage: 'https://via.placeholder.com/300x200',
          source: { name: 'Yahoo Finance' },
          publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
        }
      ];
    }

    // Generic mock news for unknown tickers
    const mockNews: NewsArticle[] = [
      {
        title: `${companyName} (${query}) shows strong performance in recent quarter`,
        description: `Recent earnings report indicates positive growth trends for ${companyName} with improved market position and customer satisfaction.`,
        url: `https://www.bloomberg.com/news/articles/${query.toLowerCase()}-earnings-analysis`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Bloomberg' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Analysts upgrade ${companyName} (${query}) rating following positive outlook`,
        description: `Major investment firms have upgraded their ratings for ${companyName} based on strong fundamentals and growth prospects.`,
        url: `https://www.reuters.com/business/finance/${query.toLowerCase()}-analyst-upgrade`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Reuters' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `${companyName} announces new strategic initiatives`,
        description: `Company leadership has outlined new strategic initiatives aimed at expanding market reach and improving operational efficiency.`,
        url: `https://www.cnbc.com/2025/10/18/${query.toLowerCase()}-strategic-initiatives.html`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'CNBC' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Market sentiment positive for ${companyName} sector`,
        description: `Overall market sentiment remains positive for the sector with ${companyName} positioned as a key player in the industry.`,
        url: `https://www.wsj.com/articles/${query.toLowerCase()}-market-sentiment-analysis`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Wall Street Journal' },
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `NVIDIA (NVDA) stock surges on strong AI chip demand`,
        description: `NVIDIA's stock price experienced a significant increase following reports of robust demand for its AI-focused graphics processing units (GPUs). The company's data center segment continues to be a primary growth driver, with analysts upgrading their forecasts.`,
        url: `https://www.bloomberg.com/news/articles/nvidia-ai-chip-demand-surge`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Bloomberg' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Tesla (TSLA) Q3 earnings beat expectations, but competition concerns linger`,
        description: `Tesla announced better-than-expected third-quarter earnings, driven by increased vehicle deliveries and improved profit margins. However, concerns about intensifying competition in the electric vehicle market and potential production bottlenecks continue to be a topic of discussion among investors.`,
        url: `https://www.reuters.com/business/autos/tesla-q3-earnings-competition`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Reuters' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Apple (AAPL) unveils new MacBook Pro with M4 chip, boosting creative professionals' interest`,
        description: `Apple introduced its latest MacBook Pro models featuring the powerful M4 chip, targeting creative professionals with enhanced performance and battery life. The announcement has generated positive buzz, with pre-orders exceeding expectations.`,
        url: `https://www.cnbc.com/2025/10/18/apple-macbook-pro-m4-chip.html`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'CNBC' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `JPMorgan Chase (JPM) navigates volatile markets with strong trading results`,
        description: `JPMorgan Chase reported robust trading revenues in its latest quarter, outperforming expectations despite broader market volatility. The bank's diversified business model and strong client relationships are cited as key factors in its resilience.`,
        url: `https://www.wsj.com/articles/jpmorgan-q3-trading-results`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Wall Street Journal' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Microsoft (MSFT) expands Azure AI capabilities, targeting enterprise cloud growth`,
        description: `Microsoft announced significant expansions to its Azure AI platform, introducing new services and tools aimed at accelerating AI adoption among enterprise clients. The move reinforces Microsoft's commitment to cloud-based AI solutions and strengthens its competitive position.`,
        url: `https://finance.yahoo.com/news/microsoft-azure-ai-expansion`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Yahoo Finance' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Alphabet (GOOGL) invests heavily in AI research and quantum computing`,
        description: `Alphabet, Google's parent company, is significantly increasing its investments in cutting-edge AI research and quantum computing initiatives. The company aims to maintain its leadership in technological innovation and explore new frontiers in artificial intelligence.`,
        url: `https://www.theverge.com/2025/10/18/alphabet-ai-quantum-investment`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'The Verge' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Amazon (AMZN) Prime Day sales break records, boosting Q4 outlook`,
        description: `Amazon's annual Prime Day event shattered previous sales records, indicating strong consumer spending and providing a positive outlook for the company's fourth-quarter performance. The e-commerce giant continues to leverage its Prime membership program for sustained growth.`,
        url: `https://www.techcrunch.com/2025/10/18/amazon-prime-day-records`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'TechCrunch' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Meta Platforms (META) focuses on AI-driven content recommendations and Reels monetization`,
        description: `Meta Platforms is prioritizing AI-driven content recommendation algorithms across its Facebook and Instagram platforms to enhance user engagement. The company is also intensifying efforts to monetize its short-form video feature, Reels, amidst growing competition.`,
        url: `https://www.engadget.com/2025/10/18/meta-ai-reels-monetization`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Engadget' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Robinhood (HOOD) expands crypto offerings, attracting new retail investors`,
        description: `Robinhood Markets announced an expansion of its cryptocurrency trading options, adding several new altcoins to its platform. The move aims to attract a broader base of retail investors interested in digital assets, driving increased engagement and transaction volumes.`,
        url: `https://www.coindesk.com/markets/2025/10/18/robinhood-crypto-expansion`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'CoinDesk' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `SentinelOne (S) partners with major cloud provider for enhanced cybersecurity solutions`,
        description: `SentinelOne announced a strategic partnership with a leading cloud service provider to integrate its AI-powered cybersecurity platform, offering enhanced threat detection and response capabilities to enterprise clients. The collaboration is expected to expand SentinelOne's market reach.`,
        url: `https://www.zdnet.com/article/sentinelone-cloud-partnership`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'ZDNet' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Banner Corporation (BMNR) reports solid loan growth in regional markets`,
        description: `Banner Corporation, a regional bank holding company, reported solid loan growth across its key markets in the latest quarter, driven by increased commercial and real estate lending. The bank's strong balance sheet and conservative lending practices continue to support its financial performance.`,
        url: `https://www.spglobal.com/marketintelligence/news/articles/banner-corp-loan-growth`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'S&P Global' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Advanced Micro Devices (AMD) unveils new data center GPUs, challenging NVIDIA's dominance`,
        description: `Advanced Micro Devices (AMD) introduced its latest generation of data center GPUs, designed to compete directly with NVIDIA in the high-growth AI and high-performance computing markets. The new chips promise significant performance improvements and energy efficiency.`,
        url: `https://www.anandtech.com/show/amd-data-center-gpu-launch`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'AnandTech' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Intel (INTC) announces strategic foundry partnerships to boost chip manufacturing capacity`,
        description: `Intel Corporation is forging new strategic partnerships with global foundries to expand its chip manufacturing capacity and accelerate its IDM 2.0 strategy. The collaborations aim to address the growing demand for semiconductors and enhance Intel's competitive position in the foundry market.`,
        url: `https://www.eetimes.com/intel-foundry-partnerships`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'EE Times' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Netflix (NFLX) Q3 subscriber growth exceeds expectations, content pipeline strong`,
        description: `Netflix reported stronger-than-expected subscriber growth in its third quarter, driven by a robust content pipeline and successful international expansion. The streaming giant's focus on original programming continues to attract and retain subscribers globally.`,
        url: `https://variety.com/2025/10/18/netflix-q3-subscribers-content`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Variety' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Bank of America (BAC) focuses on digital transformation and personalized banking experiences`,
        description: `Bank of America is accelerating its digital transformation initiatives, investing in AI-powered tools and personalized banking platforms to enhance customer experience and operational efficiency. The bank aims to strengthen its position in the evolving financial landscape.`,
        url: `https://www.americanbanker.com/news/bank-of-america-digital-transformation`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'American Banker' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Wells Fargo (WFC) streamlines operations, divests non-core assets for efficiency`,
        description: `Wells Fargo is undergoing a strategic restructuring to streamline its operations and divest non-core assets, aiming to improve efficiency and focus on its primary banking businesses. The initiatives are part of a broader effort to enhance profitability and shareholder value.`,
        url: `https://www.bizjournals.com/wells-fargo-restructuring`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Business Journals' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Goldman Sachs (GS) expands private equity investments, targets high-growth sectors`,
        description: `Goldman Sachs is actively expanding its private equity investment portfolio, focusing on high-growth sectors such as technology, healthcare, and renewable energy. The firm aims to capitalize on emerging market opportunities and diversify its investment holdings.`,
        url: `https://www.privateequitynews.com/goldman-sachs-investments`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Private Equity News' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Citigroup (C) strengthens wealth management division, attracts high-net-worth clients`,
        description: `Citigroup is bolstering its wealth management division, introducing new services and expanding its team of financial advisors to attract high-net-worth clients. The bank aims to grow its assets under management and enhance its position in the competitive wealth management market.`,
        url: `https://www.wealthmanagement.com/citigroup-expansion`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Wealth Management' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Visa (V) reports strong cross-border transaction growth, driven by international travel recovery`,
        description: `Visa announced robust growth in cross-border transaction volumes, benefiting from the ongoing recovery in international travel and e-commerce spending. The payment giant's global network continues to facilitate seamless and secure transactions worldwide.`,
        url: `https://www.pymnts.com/visa-cross-border-growth`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'PYMNTS' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Mastercard (MA) partners with fintech startups for innovative payment solutions`,
        description: `Mastercard is actively collaborating with fintech startups to develop and implement innovative payment solutions, including blockchain-based platforms and real-time payment systems. The partnerships aim to enhance Mastercard's offerings and maintain its leadership in payment technology.`,
        url: `https://www.finextra.com/mastercard-fintech-partnerships`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Finextra' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `PayPal (PYPL) expands 'Buy Now, Pay Later' services, targets e-commerce growth`,
        description: `PayPal is significantly expanding its "Buy Now, Pay Later" (BNPL) services, integrating them across more merchant platforms to capitalize on the growing trend of flexible payment options in e-commerce. The move aims to boost PayPal's transaction volumes and user engagement.`,
        url: `https://www.retaildive.com/news/paypal-bnpl-expansion`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Retail Dive' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Block (SQ) Cash App introduces new banking features, challenging traditional banks`,
        description: `Block's Cash App is rolling out new banking features, including direct deposit and bill payment options, positioning itself as a challenger to traditional banking institutions. The expansion aims to enhance Cash App's utility and attract a broader user base.`,
        url: `https://www.bankingdive.com/news/block-cash-app-banking-features`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Banking Dive' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `Coinbase (COIN) navigates crypto market volatility with new institutional products`,
        description: `Coinbase is focusing on developing new institutional-grade cryptocurrency products and services to navigate market volatility and attract large-scale investors. The exchange aims to diversify its revenue streams and strengthen its position as a leading crypto platform.`,
        url: `https://www.coindesk.com/business/2025/10/18/coinbase-institutional-products`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'CoinDesk' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      },
      {
        title: `${companyName} reports strong quarterly results`,
        description: `The company has reported better-than-expected quarterly results with strong revenue growth and improved margins.`,
        url: `https://finance.yahoo.com/news/${query.toLowerCase()}-quarterly-results-beat-expectations`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Yahoo Finance' },
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          audioAvailable: true
      }
    ];

    return mockNews;
  }

  /**
   * Get company name from ticker symbol
   */
  private getCompanyNameFromTicker(ticker: string): string {
    const tickerToCompany: { [key: string]: string } = {
      'AAPL': 'Apple Inc.',
      'NVDA': 'NVIDIA Corporation',
      'TSLA': 'Tesla Inc.',
      'MSFT': 'Microsoft Corporation',
      'GOOG': 'Alphabet Inc.',
      'AMZN': 'Amazon.com Inc.',
      'META': 'Meta Platforms Inc.',
      'HOOD': 'Robinhood Markets Inc.',
      'S': 'SentinelOne Inc.',
      'BMNR': 'Banner Corporation',
      'AMD': 'Advanced Micro Devices',
      'INTC': 'Intel Corporation',
      'NFLX': 'Netflix Inc.',
      'JPM': 'JPMorgan Chase & Co.',
      'GS': 'Goldman Sachs Group Inc.',
      'BAC': 'Bank of America Corporation',
      'WFC': 'Wells Fargo & Company',
      'C': 'Citigroup Inc.',
      'V': 'Visa Inc.',
      'MA': 'Mastercard Inc.',
      'PYPL': 'PayPal Holdings Inc.',
      'SQ': 'Block Inc.',
      'COIN': 'Coinbase Global Inc.'
    };

    return tickerToCompany[ticker.toUpperCase()] || `${ticker} Corporation`;
  }
}
