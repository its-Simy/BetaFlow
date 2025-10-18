import { NewsArticle } from './newsService';

export interface CompressedArticle {
  title: string;
  summary: string;
  source: string;
  date: string;
  url: string;
}

export class ContextCompressor {
  private readonly maxContextLength: number;
  private readonly maxArticles: number;

  constructor(maxContextLength: number = 6000, maxArticles: number = 8) {
    this.maxContextLength = maxContextLength;
    this.maxArticles = maxArticles;
  }

  /**
   * Compress articles into compact format for Gemini
   */
  compressArticles(articles: NewsArticle[]): {
    compressed: CompressedArticle[];
    totalLength: number;
    truncated: boolean;
  } {
    // Sort by recency first
    const sortedArticles = articles
      .slice(0, this.maxArticles)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const compressed: CompressedArticle[] = [];
    let totalLength = 0;
    let truncated = false;

    for (const article of sortedArticles) {
      const compressedArticle = this.compressSingleArticle(article);
      const articleLength = this.calculateLength(compressedArticle);

      // Check if adding this article would exceed our limit
      if (totalLength + articleLength > this.maxContextLength) {
        truncated = true;
        break;
      }

      compressed.push(compressedArticle);
      totalLength += articleLength;
    }

    return {
      compressed,
      totalLength,
      truncated
    };
  }

  /**
   * Compress a single article into compact format
   */
  private compressSingleArticle(article: NewsArticle): CompressedArticle {
    const date = new Date(article.publishedAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create a concise summary from description
    let summary = article.description || '';
    if (summary.length > 120) {
      summary = summary.substring(0, 117) + '...';
    }

    // Clean up the title
    let title = article.title;
    if (title.length > 100) {
      title = title.substring(0, 97) + '...';
    }

    return {
      title: title.trim(),
      summary: summary.trim(),
      source: article.source.name,
      date: formattedDate,
      url: article.url
    };
  }

  /**
   * Calculate the character length of a compressed article
   */
  private calculateLength(article: CompressedArticle): number {
    return `• ${article.title} — ${article.summary} — ${article.source} — ${article.date}`.length;
  }

  /**
   * Format compressed articles for Gemini prompt
   */
  formatForPrompt(compressed: CompressedArticle[]): string {
    if (compressed.length === 0) {
      return 'No recent news articles found.';
    }

    const formatted = compressed.map(article => 
      `• ${article.title} — ${article.summary} — ${article.source} — ${article.date}`
    ).join('\n');

    return `Recent news articles:\n${formatted}`;
  }

  /**
   * Create a summary of the compression process
   */
  getCompressionSummary(originalCount: number, compressedCount: number, totalLength: number): string {
    return `Compressed ${originalCount} articles to ${compressedCount} articles (${totalLength} chars)`;
  }
}
