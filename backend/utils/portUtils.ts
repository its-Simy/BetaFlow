import net from 'net';

export const findAvailablePort = async (preferredPort: number, fallbackPorts: number[] = []): Promise<number> => {
  const isPortAvailable = (port: number): Promise<boolean> => {
    return new Promise((resolve) => {
      const server = net.createServer();
      
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

export const getPortFromEnv = (): number => {
  return parseInt(process.env.PORT || '5055', 10);
};

export const getFallbackPorts = (): number[] => {
  const fallbackPorts = process.env.FALLBACK_PORTS || '5056,5057,5058,8000,8001,8002';
  return fallbackPorts.split(',').map(port => parseInt(port.trim(), 10));
};
