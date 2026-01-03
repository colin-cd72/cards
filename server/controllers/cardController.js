const Card = require('../models/Card');
const sanitizeHtml = require('sanitize-html');
const logger = require('../utils/logger');

// Sanitize HTML options
const sanitizeOptions = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div'],
  allowedAttributes: {
    'span': ['style'],
    'p': ['style'],
    'div': ['style']
  },
  allowedStyles: {
    '*': {
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'font-weight': [/^(bold|normal|\d+)$/],
      'font-style': [/^(italic|normal)$/],
      'text-decoration': [/^(underline|none)$/]
    }
  }
};

// Store current card state in memory
let currentCard = null;

const cardController = {
  getCurrentCard() {
    return currentCard;
  },

  setCurrentCard(card) {
    currentCard = card;
  },

  clearCurrentCard() {
    currentCard = null;
  },

  async send(req, res, next) {
    try {
      const data = {
        ...req.validatedBody,
        user_id: req.session.userId,
        body_html: sanitizeHtml(req.validatedBody.body_html, sanitizeOptions)
      };

      const id = await Card.create(data);
      const card = await Card.findById(id);

      // Update current card
      currentCard = card;

      logger.info(`Card sent by ${req.session.username}`);

      // Emit to socket (handled by socket module)
      if (req.app.get('io')) {
        req.app.get('io').to('outputs').emit('card:display', {
          headerText: card.header_text,
          bodyHtml: card.body_html,
          badgeNumber: card.badge_number,
          sentAt: card.sent_at,
          sentBy: card.sent_by
        });
      }

      res.json({
        success: true,
        cardId: card.id,
        sentAt: card.sent_at
      });
    } catch (error) {
      next(error);
    }
  },

  async clear(req, res, next) {
    try {
      // Clear current card
      currentCard = null;

      logger.info(`Card cleared by ${req.session.username}`);

      // Emit to socket
      if (req.app.get('io')) {
        req.app.get('io').to('outputs').emit('card:blank');
      }

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },

  async current(req, res, next) {
    try {
      res.json({ card: currentCard });
    } catch (error) {
      next(error);
    }
  },

  async history(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const cards = await Card.getHistory(limit, offset);
      res.json({ cards });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = cardController;
