require('dotenv').config();

const http = require('http');
const app = require('./app');
const { initializeDatabase, testConnection } = require('./config/database');
const { sessionMiddleware } = require('./config/session');
const { initSocket } = require('./socket');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 4545;

function start() {
  // Initialize and test database
  if (!testConnection()) {
    logger.error('Failed to connect to database');
    process.exit(1);
  }

  // Initialize database schema and default data
  initializeDatabase();

  // Create HTTP server
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = initSocket(server, sessionMiddleware);
  app.set('io', io);

  // Start server
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

start();
