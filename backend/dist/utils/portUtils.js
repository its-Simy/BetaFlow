"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFallbackPorts = exports.getPortFromEnv = exports.findAvailablePort = void 0;
const net_1 = __importDefault(require("net"));
const findAvailablePort = async (preferredPort, fallbackPorts = []) => {
    const isPortAvailable = (port) => {
        return new Promise((resolve) => {
            const server = net_1.default.createServer();
            server.listen(port, () => {
                server.once('close', () => {
                    resolve(true);
                });
                server.close();
            });
            server.on('error', () => {
                resolve(false);
            });
        });
    };
    // Try preferred port first
    if (await isPortAvailable(preferredPort)) {
        return preferredPort;
    }
    // Try fallback ports
    for (const port of fallbackPorts) {
        if (await isPortAvailable(port)) {
            console.log(`⚠️  Port ${preferredPort} was busy, using port ${port} instead`);
            return port;
        }
    }
    // If all ports are busy, let the system assign one
    console.log(`⚠️  All preferred ports are busy, system will assign an available port`);
    return 0; // 0 means let the system assign
};
exports.findAvailablePort = findAvailablePort;
const getPortFromEnv = () => {
    return parseInt(process.env.PORT || '5055', 10);
};
exports.getPortFromEnv = getPortFromEnv;
const getFallbackPorts = () => {
    const fallbackPorts = process.env.FALLBACK_PORTS || '5056,5057,5058,8000,8001,8002';
    return fallbackPorts.split(',').map(port => parseInt(port.trim(), 10));
};
exports.getFallbackPorts = getFallbackPorts;
//# sourceMappingURL=portUtils.js.map