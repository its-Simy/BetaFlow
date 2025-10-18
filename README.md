# BetaFlow - AI-Powered Financial Dashboard

A comprehensive financial dashboard built with Next.js 14, TypeScript, and Tailwind CSS. Features portfolio management, real-time market analysis, news integration, and AI-powered insights.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/its-Simy/BetaFlow.git
   cd BetaFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL**
   ```bash
   # Install PostgreSQL (macOS)
   brew install postgresql@15
   brew services start postgresql@15
   
   # Or install via your system's package manager
   ```

4. **Set up the database**
   ```bash
   npm run setup-db
   ```

5. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys (optional for basic functionality)
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

The application uses PostgreSQL for data storage. The setup script will:

- Create the `financial_track` database
- Set up tables for users and portfolio holdings
- Add sample data for testing

### Manual Database Setup

If the automated setup doesn't work:

```bash
# Create database
createdb financial_track

# Run schema
psql financial_track -f database/schema.sql

# Add sample data (optional)
psql financial_track -f database/seed.sql
```

## 🎯 Features

### Authentication
- User registration and login
- JWT-based authentication
- Secure password hashing

### Portfolio Management
- Add stocks to your portfolio
- Track current prices and performance
- View profit/loss calculations
- Remove holdings

### Market Analysis
- Real-time stock data via yfinance
- Interactive price charts
- Stock search with suggestions
- Company information and metrics

### AI Integration
- AI-powered portfolio analysis
- Market insights and recommendations
- News sentiment analysis

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run setup-db` - Set up database
- `npm run reset-db` - Reset database with fresh data

### Project Structure

```
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── tabs/           # Main dashboard tabs
│   └── ui/             # Reusable UI components
├── pages/              # Next.js pages and API routes
│   ├── api/            # Backend API endpoints
│   └── index.tsx       # Main dashboard page
├── database/           # Database schema and setup
├── lib/                # Utility functions and services
├── scripts/            # Setup and utility scripts
└── stock-service/      # Python microservice for stock data
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username@localhost:5432/financial_track"

# JWT Secret (required)
JWT_SECRET="your-super-secret-jwt-key-here"

# API Keys (optional - app works without them)
POLYGON_API_KEY=your_polygon_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
NEWS_API_KEY=your_news_api_key_here
ELEVEN_API_KEY=your_elevenlabs_api_key_here

# Backend Configuration
BACKEND_PORT=5001
FALLBACK_PORTS=5002,5003,5004,5005
NODE_ENV=development
```

### API Keys (Optional)

The application works without API keys, but you can add them for enhanced functionality:

- **POLYGON_API_KEY**: For additional market data
- **GEMINI_API_KEY**: For AI-powered insights
- **NEWS_API_KEY**: For financial news
- **ELEVEN_API_KEY**: For text-to-speech features

## 🐛 Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure PostgreSQL is running: `brew services start postgresql@15`
   - Check your `DATABASE_URL` in `.env`
   - Run `npm run setup-db`

2. **Port already in use**
   - The app will automatically try ports 3001, 3002, etc.
   - Or kill the process: `lsof -ti:3000 | xargs kill -9`

3. **Module not found errors**
   - Delete `node_modules` and run `npm install`
   - Clear Next.js cache: `rm -rf .next`

4. **TypeScript compilation errors**
   - Run `npx tsc --noEmit` to check for type errors
   - Ensure all dependencies are installed

### Getting Help

- Check the [Issues](https://github.com/its-Simy/BetaFlow/issues) page
- Review the troubleshooting section above
- Ensure all prerequisites are installed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Charts powered by [Recharts](https://recharts.org/)
- Stock data from [yfinance](https://github.com/ranaroussi/yfinance)