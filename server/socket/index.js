const { Server } = require('socket.io');
const logger = require('../utils/logger');
const cardController = require('../controllers/cardController');

let io;

// Track connected clients
const connectedClients = {
  outputs: new Set(),
  users: new Set()
};

function initSocket(server, sessionMiddleware) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',')
        : ['http://localhost:4545'],
      credentials: true
    }
  });

  // Share session middleware with socket.io
  io.engine.use(sessionMiddleware);

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);

    // Send current card state on connection
    const currentCard = cardController.getCurrentCard();
    socket.emit('card:current', { card: currentCard });

    // Handle output page joining
    socket.on('output:join', () => {
      socket.join('outputs');
      connectedClients.outputs.add(socket.id);
      logger.info(`Output display connected: ${socket.id}`);
      broadcastConnectionCount();
    });

    // Handle output page leaving
    socket.on('output:leave', () => {
      socket.leave('outputs');
      connectedClients.outputs.delete(socket.id);
      logger.info(`Output display disconnected: ${socket.id}`);
      broadcastConnectionCount();
    });

    // Handle user joining
    socket.on('user:join', (data) => {
      socket.join('users');
      connectedClients.users.add(socket.id);
      logger.info(`User connected: ${socket.id}`);
      broadcastConnectionCount();
    });

    // Handle card send (backup - mainly handled via REST API)
    socket.on('card:send', (data) => {
      logger.debug(`Card sent via socket from ${socket.id}`);
      // The REST API handles the actual save and broadcast
    });

    // Handle card clear (backup)
    socket.on('card:clear', () => {
      logger.debug(`Card cleared via socket from ${socket.id}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      connectedClients.outputs.delete(socket.id);
      connectedClients.users.delete(socket.id);
      logger.debug(`Socket disconnected: ${socket.id}`);
      broadcastConnectionCount();
    });
  });

  return io;
}

function broadcastConnectionCount() {
  if (io) {
    io.emit('connection:count', {
      outputs: connectedClients.outputs.size,
      users: connectedClients.users.size
    });
  }
}

function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
