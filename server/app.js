const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { sessionMiddleware } = require('./config/session');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Trust proxy (for CloudPanel/nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Disabled for development, configure for production
}));

// CORS
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:4545'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(sessionMiddleware);

// Request logging
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    logger.debug(`${req.method} ${req.path}`);
  }
  next();
});

// API routes
app.use('/api', routes);

// Serve static files from React build (production)
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      // In development, client is served separately
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Broadcast Cards</title></head>
          <body>
            <h1>Broadcast Cards API Server</h1>
            <p>API is running. In production, the React app will be served here.</p>
            <p>In development, run the client separately with: cd client && npm run dev</p>
          </body>
        </html>
      `);
    }
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;
