# Financial Track - AI-Powered Market Intelligence Dashboard

A comprehensive financial dashboard built with Next.js 14, TypeScript, and Tailwind CSS. Features portfolio management, real-time market analysis, news integration, and AI-powered insights.

![Financial Track Dashboard](https://via.placeholder.com/800x400/1e293b/ffffff?text=Financial+Track+Dashboard)

## 🚀 Features

### 📊 **Interactive Dashboard**
- **Summary Tab** - Market overview with trending stocks and AI insights
- **News Tab** - Financial news with AI-powered search and audio reading
- **Portfolio Tab** - Complete portfolio management with P&L tracking
- **Stocks Tab** - Searchable stock database with AI recommendations
- **AI Analysis Tab** - Gemini AI integration for market analysis

### 💼 **Portfolio Management**
- ✅ Add/Remove stocks dynamically
- ✅ Buy price tracking for accurate P&L calculations
- ✅ Real-time profit/loss monitoring
- ✅ Portfolio diversification analysis
- ✅ Risk assessment and metrics

### 🤖 **AI Integration Ready**
- Gemini AI for market analysis
- News API integration
- ElevenLabs audio synthesis
- Real-time data processing

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Custom UI Components
- **Icons**: Lucide React
- **UI Components**: Radix UI Primitives
- **Development**: ESLint, PostCSS, Autoprefixer

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd BetaFlow-
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Open Your Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── components/          # React components
│   ├── tabs/           # Dashboard tab components
│   │   ├── SummaryTab.tsx
│   │   ├── NewsTab.tsx
│   │   ├── PortfolioTab.tsx
│   │   ├── StocksTab.tsx
│   │   └── AIAnalysisTab.tsx
│   └── ui/             # Reusable UI components
│       ├── button.tsx
│       ├── card.tsx
│       ├── tabs.tsx
│       └── ...
├── pages/              # Next.js pages
│   ├── _app.tsx
│   └── index.tsx
├── styles/             # Global CSS and Tailwind
│   └── globals.css
├── backend/            # Backend structure (ready for API development)
├── lib/                # Utility functions
└── public/             # Static assets
```

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start           # Start production server

# Code Quality
npm run lint        # Run ESLint
```

## 🌐 Environment Variables

Create a `.env.local` file for API integrations:

```env
# Gemini AI API
GEMINI_API_KEY=your_gemini_api_key

# News API
NEWS_API_KEY=your_news_api_key

# ElevenLabs API
ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

## 📊 Key Features

### Portfolio Management
- **Dynamic Stock Addition**: Add stocks with buy prices and share quantities
- **Real-time P&L**: Track profit/loss based on your actual purchase prices
- **Portfolio Analytics**: Diversification scores, risk metrics, and sector allocation
- **Position Management**: Remove positions you no longer hold

### Market Analysis
- **Trending Stocks**: Real-time market movers and trending tickers
- **AI Insights**: Gemini-powered market analysis and recommendations
- **Risk Assessment**: Portfolio risk metrics and correlation analysis
- **Sector Allocation**: Visual breakdown of portfolio diversification

### News Integration
- **Financial News**: Curated financial news with AI-powered search
- **Audio Reading**: ElevenLabs integration for news audio synthesis
- **Market Sentiment**: AI analysis of market sentiment and trends

## 🎨 UI/UX Features

- **Dark Theme**: Modern dark interface with gradient accents
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Interactive Elements**: Smooth animations and hover effects
- **Color-coded Data**: Green/red indicators for gains/losses
- **Accessible Design**: WCAG compliant with proper contrast ratios

## 🔮 Future Enhancements

- [ ] Real-time stock price APIs
- [ ] User authentication and portfolio persistence
- [ ] Advanced charting and technical analysis
- [ ] Options trading integration
- [ ] Social trading features
- [ ] Mobile app development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: [your-email@example.com]
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/BetaFlow-/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-username/BetaFlow-/discussions)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Lucide](https://lucide.dev/) - Icon library

---

**Built with ❤️ for the financial community**