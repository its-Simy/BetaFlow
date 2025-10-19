import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import newsRoutes from "./routes/news";
import audioRoutes from './routes/audio'
import readNewsRouter from "./routes/readNews";
import insightsRoutes from "./routes/insights";
import { findAvailablePort, getPortFromEnv, getFallbackPorts } from "./utils/portUtils";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/audio', audioRoutes);
app.use("/api/news", newsRoutes);
app.use("/readnews", readNewsRouter);
app.use("/api/insights", insightsRoutes);

// Smart port detection
const startServer = async () => {
  const preferredPort = getPortFromEnv();
  const fallbackPorts = getFallbackPorts();
  
  try {
    const port = await findAvailablePort(preferredPort, fallbackPorts);
    
    app.listen(port, () => {
      console.log(`🚀 Backend running on port ${port}`);
      console.log(`📡 API available at: http://localhost:${port}`);
      console.log(`📰 News endpoint: http://localhost:${port}/api/news`);
      console.log(`🤖 AI Insights endpoint: http://localhost:${port}/api/insights`);
      
      // Write the actual port to a file for frontend to read
      const fs = require('fs');
      const path = require('path');
      const portFile = path.join(__dirname, '..', '.backend-port');
      fs.writeFileSync(portFile, port.toString());
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();