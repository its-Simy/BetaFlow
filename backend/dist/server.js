"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const news_1 = __importDefault(require("./routes/news"));
const audio_1 = __importDefault(require("./routes/audio"));
const readNews_1 = __importDefault(require("./routes/readNews"));
const insights_1 = __importDefault(require("./routes/insights"));
const portUtils_1 = require("./utils/portUtils");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/audio', audio_1.default);
app.use("/api/news", news_1.default);
app.use("/readnews", readNews_1.default);
app.use("/api/insights", insights_1.default);
// Smart port detection
const startServer = async () => {
    const preferredPort = (0, portUtils_1.getPortFromEnv)();
    const fallbackPorts = (0, portUtils_1.getFallbackPorts)();
    try {
        const port = await (0, portUtils_1.findAvailablePort)(preferredPort, fallbackPorts);
        app.listen(port, () => {
            console.log(`🚀 Backend running on port ${port}`);
            console.log(`📡 API available at: http://localhost:${port}`);
            console.log(`📰 News endpoint: http://localhost:${port}/api/news`);
            // Write the actual port to a file for frontend to read
            const fs = require('fs');
            const path = require('path');
            const portFile = path.join(__dirname, '..', '.backend-port');
            fs.writeFileSync(portFile, port.toString());
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map