import app from './app.js';
import { config } from './config/index.js';
import './config/firebase.js';

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(`🚀 Retail Next API Server is running!`);
  console.log(`📡 Environment : ${config.nodeEnv}`);
  console.log(`🌐 Port        : ${config.port}`);
  console.log(`🔗 Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
  console.log(`=========================================`);
});

// Handle graceful shutdown
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));
