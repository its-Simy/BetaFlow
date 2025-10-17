import axios from "axios";
import { NewsArticle } from "../types/NewsArticle";
import dotenv from "dotenv";
dotenv.config()
export const fetchNews = async (): Promise<NewsArticle[]> => {
  const url = "https://newsapi.org/v2/top-headlines";
  const response = await axios.get(url, {
    params: {
      language: "en",
      pageSize: 50,
      sortBy: "publishedAt",
      apiKey: process.env.NEWS_API_KEY,
    },
  });

  return response.data.articles.map((article: any) => ({
    title: article.title,
    description: article.description,
    url: article.url,
    image: article.urlToImage,
    source: article.source.name,
    publishedAt: article.publishedAt,
  }));
};