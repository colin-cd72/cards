const session = require('express-session');
const SqliteStore = require('better-sqlite3-session-store')(session);
const { db } = require('./database');

const sessionStore = new SqliteStore({
  client: db,
  expired: {
    clear: true,
    intervalMs: 900000 // 15 minutes
  }
});

const sessionMiddleware = session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'change-this-secret-key',
  resave: false,
  saveUninitialized: false,
  name: 'broadcast_cards_session',
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
});

module.exports = { sessionMiddleware, sessionStore };
