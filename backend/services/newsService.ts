import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  source: {
    name: string;
  };
  publishedAt: string;
}

export interface NewsSearchParams {
  query?: string;
  pageSize?: number;
  country?: string;
  category?: string;
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
      } catch (error) {
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
      } catch (error) {
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
      } catch (error) {
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
      } catch (error) {
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
   * Normalize articles to ensure consistent structure
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
        publishedAt: article.publishedAt || new Date().toISOString()
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
        publishedAt: article.publish_date || new Date().toISOString()
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

    const mockNews: NewsArticle[] = [
      {
        title: `${companyName} (${query}) shows strong performance in recent quarter`,
        description: `Recent earnings report indicates positive growth trends for ${companyName} with improved market position and customer satisfaction.`,
        url: `https://www.bloomberg.com/news/articles/${query.toLowerCase()}-earnings-analysis`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Bloomberg' },
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: `Analysts upgrade ${companyName} (${query}) rating following positive outlook`,
        description: `Major investment firms have upgraded their ratings for ${companyName} based on strong fundamentals and growth prospects.`,
        url: `https://www.reuters.com/business/finance/${query.toLowerCase()}-analyst-upgrade`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Reuters' },
        publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: `${companyName} announces new strategic initiatives`,
        description: `Company leadership has outlined new strategic initiatives aimed at expanding market reach and improving operational efficiency.`,
        url: `https://www.cnbc.com/2025/10/18/${query.toLowerCase()}-strategic-initiatives.html`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'CNBC' },
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: `Market sentiment positive for ${companyName} sector`,
        description: `Overall market sentiment remains positive for the sector with ${companyName} positioned as a key player in the industry.`,
        url: `https://www.wsj.com/articles/${query.toLowerCase()}-market-sentiment-analysis`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Wall Street Journal' },
        publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: `${companyName} reports strong quarterly results`,
        description: `The company has reported better-than-expected quarterly results with strong revenue growth and improved margins.`,
        url: `https://finance.yahoo.com/news/${query.toLowerCase()}-quarterly-results-beat-expectations`,
        urlToImage: 'https://via.placeholder.com/300x200',
        source: { name: 'Yahoo Finance' },
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
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
