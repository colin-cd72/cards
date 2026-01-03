import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import './OutputPage.css';

export default function OutputPage() {
  const { socket, connected } = useSocket();
  const [currentCard, setCurrentCard] = useState(null);
  const [isBlank, setIsBlank] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [inverse, setInverse] = useState(false);
  const [fontSize, setFontSize] = useState(48);

  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Calculate font size to fit content in viewport
  const calculateFontSize = useCallback(() => {
    if (!containerRef.current || !contentRef.current || isBlank || !currentCard) {
      return;
    }

    const container = containerRef.current;
    const content = contentRef.current;
    const padding = 60;

    const availableHeight = container.clientHeight - (padding * 2);
    const availableWidth = container.clientWidth - (padding * 2);

    // Binary search for optimal font size
    let minSize = 16;
    let maxSize = 200;
    let optimalSize = minSize;

    while (minSize <= maxSize) {
      const midSize = Math.floor((minSize + maxSize) / 2);
      content.style.fontSize = `${midSize}px`;

      // Force reflow
      const contentHeight = content.scrollHeight;
      const contentWidth = content.scrollWidth;

      if (contentHeight <= availableHeight && contentWidth <= availableWidth) {
        optimalSize = midSize;
        minSize = midSize + 1;
      } else {
        maxSize = midSize - 1;
      }
    }

    setFontSize(optimalSize);
  }, [isBlank, currentCard]);

  // Recalculate on window resize
  useEffect(() => {
    const handleResize = () => calculateFontSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateFontSize]);

  // Recalculate when card changes
  useEffect(() => {
    if (currentCard && !isBlank) {
      // Delay to ensure content is rendered
      setTimeout(calculateFontSize, 50);
    }
  }, [currentCard, isBlank, calculateFontSize]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Press 'F' to toggle fullscreen
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  // Recalculate on fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setTimeout(calculateFontSize, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [calculateFontSize]);

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
        badgeNumber: data.badgeNumber,
        hideHeader: data.hideHeader || false
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
    <div className={`output-page ${inverse ? 'inverse' : ''}`} onClick={toggleFullscreen} ref={containerRef}>
      <div className={`card-display ${transitioning ? 'transitioning' : ''} ${isBlank ? 'blank' : ''}`}>
        {!isBlank && currentCard && (
          <div className="card-content" ref={contentRef} style={{ fontSize: `${fontSize}px` }}>
            {currentCard.badgeNumber && (
              <div className="card-badge">{currentCard.badgeNumber}</div>
            )}
            {!currentCard.hideHeader && (
              <div className="card-header">{currentCard.headerText}</div>
            )}
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
