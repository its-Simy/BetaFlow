"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchNews = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "../.env" });
dotenv_1.default.config();
const fetchNews = async () => {
    const url = "https://newsapi.org/v2/top-headlines";
    const response = await axios_1.default.get(url, {
        params: {
            language: "en",
            pageSize: 50,
            sortBy: "publishedAt",
            apiKey: process.env.NEWS_API_KEY,
        },
    });
    return response.data.articles.map((article) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        image: article.urlToImage,
        source: article.source.name,
        publishedAt: article.publishedAt,
    }));
};
exports.fetchNews = fetchNews;
//# sourceMappingURL=fetchNews.js.map