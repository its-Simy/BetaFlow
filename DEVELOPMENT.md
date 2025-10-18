# BetaFlow Development Guide

## 🚀 Quick Start

### Option 1: Use the startup script (Recommended)
```bash
./start-dev.sh
```

### Option 2: Manual startup
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd ..
npm run dev
```

## 🔧 Port Management

### How it works:
- **Backend**: Automatically finds an available port starting from 5055
- **Frontend**: Automatically detects backend port via environment variables
- **No more port conflicts**: The system handles port detection automatically

### Environment Files:
- `.env.example` - Template for environment configuration
- `.env.local` - Frontend environment (auto-detected by Next.js)
- `backend/.env` - Backend environment

### Customizing Ports:
If you need to use different ports, update these files:

**Frontend (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT
```

**Backend (.env):**
```
BACKEND_PORT=YOUR_PORT
FALLBACK_PORTS=5056,5057,5058,8000,8001,8002
```

## 🛠️ Troubleshooting

### Port Conflicts:
1. Run `./start-dev.sh` - it will detect and offer to kill conflicting processes
2. Or manually kill processes: `lsof -i :PORT_NUMBER` then `kill -9 PID`

### Backend Won't Start:
1. Check if NEWS_API_KEY is set in `backend/.env`
2. Run `npm run build` in backend directory
3. Check console for specific error messages

### Frontend Can't Connect to Backend:
1. Verify backend is running (check terminal output)
2. Check if `.env.local` has correct NEXT_PUBLIC_API_URL
3. Ensure both servers are running

## 📁 Project Structure

```
BetaFlow-/
├── backend/           # Express.js API server
│   ├── .env          # Backend environment config
│   ├── utils/        # Utility functions (port detection)
│   └── routes/       # API routes
├── components/        # React components
├── lib/              # Frontend utilities (API config)
├── .env.local        # Frontend environment config
├── .env.example      # Environment template
└── start-dev.sh      # Development startup script
```

## 🔄 Team Workflow

1. **Pull latest changes**
2. **Copy environment template**: `cp .env.example .env.local`
3. **Update NEWS_API_KEY** in `backend/.env` with your API key
4. **Run startup script**: `./start-dev.sh`
5. **Start coding!**

## 🌍 Cross-Platform Compatibility

This setup works on:
- ✅ macOS
- ✅ Linux  
- ✅ Windows (with WSL or Git Bash)

The port detection system automatically handles OS differences.

## 📝 Notes

- Backend writes its actual port to `.backend-port` file
- Frontend reads from environment variables for API URLs
- All hardcoded ports have been removed from the codebase
- Port conflicts are automatically resolved with fallback ports
