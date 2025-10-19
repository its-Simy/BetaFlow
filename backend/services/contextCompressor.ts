import { NewsArticle } from './newsService';

export interface CompressedContext {
  summary: string;
  articleCount: number;
  tokenCount: number;
}

export class ContextCompressor {
  private readonly maxTokens: number;
  private readonly tokenPerChar: number = 0.25; // Rough estimate: 4 chars per token

  constructor(maxTokens: number = 2000) {
    this.maxTokens = maxTokens;
  }

  /**
   * Compress news articles into a compact bulleted list
   */
  compressNewsContext(articles: NewsArticle[], symbol?: string): CompressedContext {
    if (articles.length === 0) {
      return {
        summary: 'No recent news available.',
        articleCount: 0,
        tokenCount: 0
      };
    }

    // Sort articles by relevance and recency
    const sortedArticles = this.sortArticlesByRelevance(articles, symbol);
    
    // Start with a header
    let context = `Recent news about ${symbol || 'the market'}:\n\n`;
    let currentTokens = this.estimateTokens(context);
    let includedArticles = 0;

    for (const article of sortedArticles) {
      const articleSummary = this.createArticleSummary(article, symbol);
      const articleTokens = this.estimateTokens(articleSummary);
      
      // Check if adding this article would exceed our token limit
      if (currentTokens + articleTokens > this.maxTokens) {
        break;
      }

      context += articleSummary + '\n';
      currentTokens += articleTokens;
      includedArticles++;
    }

    // Add a footer if we have more articles
    if (includedArticles < articles.length) {
      const remainingCount = articles.length - includedArticles;
      context += `\n... and ${remainingCount} more articles`;
      currentTokens += this.estimateTokens(`\n... and ${remainingCount} more articles`);
    }

    return {
      summary: context.trim(),
      articleCount: includedArticles,
      tokenCount: Math.round(currentTokens)
    };
  }

  /**
   * Create a compact summary for a single article
   */
  private createArticleSummary(article: NewsArticle, symbol?: string): string {
    const title = this.truncateText(article.title, 100);
    const description = this.truncateText(article.description, 150);
    const source = article.source.name;
    const date = this.formatDate(article.publishedAt);

    return `• ${title} (${source}, ${date})\n  ${description}`;
  }

  /**
   * Sort articles by relevance to the symbol and recency
   */
  private sortArticlesByRelevance(articles: NewsArticle[], symbol?: string): NewsArticle[] {
    return articles.sort((a, b) => {
      // First, prioritize articles that mention the symbol
      const aHasSymbol = symbol ? this.articleMentionsSymbol(a, symbol) : false;
      const bHasSymbol = symbol ? this.articleMentionsSymbol(b, symbol) : false;
      
      if (aHasSymbol && !bHasSymbol) return -1;
      if (!aHasSymbol && bHasSymbol) return 1;
      
      // Then sort by recency
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  /**
   * Check if an article mentions a specific symbol
   */
  private articleMentionsSymbol(article: NewsArticle, symbol: string): boolean {
    const text = `${article.title} ${article.description}`.toLowerCase();
    return text.includes(symbol.toLowerCase());
  }

  /**
   * Truncate text to a maximum length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Format date to a readable string
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Estimate token count for text (rough approximation)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length * this.tokenPerChar);
  }

  /**
   * Compress a general query context
   */
  compressQueryContext(query: string, articles?: NewsArticle[]): CompressedContext {
    let context = `Query: "${query}"\n\n`;
    
    if (articles && articles.length > 0) {
      context += 'Relevant news context:\n';
      const compressedNews = this.compressNewsContext(articles);
      context += compressedNews.summary;
    } else {
      context += 'No specific news context available.';
    }

    return {
      summary: context,
      articleCount: articles?.length || 0,
      tokenCount: this.estimateTokens(context)
    };
  }
}
