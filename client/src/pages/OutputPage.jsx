import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import './OutputPage.css';

// Base dimensions for the card content (will be scaled to fill screen)
const BASE_WIDTH = 800;
const BASE_PADDING = 60;

export default function OutputPage() {
  const { socket, connected } = useSocket();
  const [currentCard, setCurrentCard] = useState(null);
  const [isBlank, setIsBlank] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [inverse, setInverse] = useState(false);
  const [scale, setScale] = useState(1);

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Auto-scale content to fill the viewport
  const calculateScale = useCallback(() => {
    if (!containerRef.current || !contentRef.current || isBlank) {
      setScale(1);
      return;
    }

    const container = containerRef.current;
    const content = contentRef.current;

    // Available space in viewport (with padding)
    const availableWidth = container.clientWidth - (BASE_PADDING * 2);
    const availableHeight = container.clientHeight - (BASE_PADDING * 2);

    // Content's natural size at base width
    const contentHeight = content.scrollHeight;

    // Calculate scale to fill width
    const scaleX = availableWidth / BASE_WIDTH;
    // Calculate scale to fit height
    const scaleY = availableHeight / contentHeight;

    // Use the smaller scale to ensure content fits both dimensions
    const newScale = Math.min(scaleX, scaleY);

    setScale(newScale > 0 ? newScale : 1);
  }, [isBlank]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => calculateScale();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale]);

  // Recalculate when card changes
  useEffect(() => {
    if (currentCard && !isBlank) {
      // Small delay to ensure content is rendered
      setTimeout(calculateScale, 50);
    }
  }, [currentCard, isBlank, calculateScale]);

  useEffect(() => {
    // Load output settings
    loadSettings();

    // Join output room
    if (socket && connected) {
      socket.emit('output:join');

      // Load current card state
      loadCurrentCard();

      // Listen for card updates
      socket.on('card:display', handleCardDisplay);
      socket.on('card:blank', handleCardBlank);
      socket.on('card:current', handleCurrentCard);
      socket.on('settings:update', handleSettingsUpdate);

      return () => {
        socket.emit('output:leave');
        socket.off('card:display', handleCardDisplay);
        socket.off('card:blank', handleCardBlank);
        socket.off('card:current', handleCurrentCard);
        socket.off('settings:update', handleSettingsUpdate);
      };
    }
  }, [socket, connected]);

  async function loadSettings() {
    try {
      const response = await api.get('/settings/public/output');
      if (response.data.settings) {
        setInverse(response.data.settings.inverse || false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function loadCurrentCard() {
    try {
      const response = await api.get('/cards/current');
      if (response.data.card) {
        setCurrentCard({
          headerText: response.data.card.header_text,
          bodyHtml: response.data.card.body_html,
          badgeNumber: response.data.card.badge_number
        });
        setIsBlank(false);
      }
    } catch (error) {
      console.error('Failed to load current card:', error);
    }
  }

  function handleCardDisplay(data) {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentCard({
        headerText: data.headerText,
        bodyHtml: data.bodyHtml,
        badgeNumber: data.badgeNumber
      });
      setIsBlank(false);
      setTransitioning(false);
    }, 150);
  }

  function handleCardBlank() {
    setTransitioning(true);
    setTimeout(() => {
      setCurrentCard(null);
      setIsBlank(true);
      setTransitioning(false);
    }, 150);
  }

  function handleCurrentCard(data) {
    if (data.card) {
      setCurrentCard({
        headerText: data.card.header_text,
        bodyHtml: data.card.body_html,
        badgeNumber: data.card.badge_number
      });
      setIsBlank(false);
    } else {
      setIsBlank(true);
    }
  }

  function handleSettingsUpdate(data) {
    if (data.settings) {
      setInverse(data.settings.inverse || false);
    }
  }

  return (
    <div className={`output-page ${inverse ? 'inverse' : ''}`} ref={containerRef}>
      <div className={`card-display ${transitioning ? 'transitioning' : ''} ${isBlank ? 'blank' : ''}`}>
        {!isBlank && currentCard && (
          <div
            className="card-content"
            ref={contentRef}
            style={{
              width: `${BASE_WIDTH}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left'
            }}
          >
            {currentCard.badgeNumber && (
              <div className="card-badge">{currentCard.badgeNumber}</div>
            )}
            <div className="card-header">{currentCard.headerText}</div>
            <div
              className="card-body"
              dangerouslySetInnerHTML={{ __html: currentCard.bodyHtml }}
            />
          </div>
        )}
      </div>

      {/* Connection indicator - small, unobtrusive */}
      <div className={`output-connection ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? '' : 'Reconnecting...'}
      </div>
    </div>
  );
}
