// Frontend utility to dynamically detect backend port
export const getBackendUrl = (): string => {
  // First, try to read from environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If running in browser, try to detect from common ports
  if (typeof window !== 'undefined') {
    // Try common development ports
    const commonPorts = [5055, 5056, 5057, 5058, 8000, 8001, 8002, 5000, 5001];
    
    // For now, return the first port - in a real app you'd ping each one
    // This is a simplified version - you could implement actual port detection
    return `http://localhost:${commonPorts[0]}`;
  }

  // Fallback
  return 'http://localhost:5055';
};

export const getApiEndpoint = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${endpoint}`;
};

// Helper functions for common API calls
export const apiEndpoints = {
  news: () => getApiEndpoint('/api/news'),
  readNews: () => getApiEndpoint('/readnews'),
  audio: () => getApiEndpoint('/api/audio'),
};
