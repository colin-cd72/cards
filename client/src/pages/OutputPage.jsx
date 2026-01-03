import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import './OutputPage.css';

export default function OutputPage() {
  const { socket, connected } = useSocket();
  const [currentCard, setCurrentCard] = useState(null);
  const [isBlank, setIsBlank] = useState(true);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    // Join output room
    if (socket && connected) {
      socket.emit('output:join');

      // Load current card state
      loadCurrentCard();

      // Listen for card updates
      socket.on('card:display', handleCardDisplay);
      socket.on('card:blank', handleCardBlank);
      socket.on('card:current', handleCurrentCard);

      return () => {
        socket.emit('output:leave');
        socket.off('card:display', handleCardDisplay);
        socket.off('card:blank', handleCardBlank);
        socket.off('card:current', handleCurrentCard);
      };
    }
  }, [socket, connected]);

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

  return (
    <div className="output-page">
      <div className={`card-display ${transitioning ? 'transitioning' : ''} ${isBlank ? 'blank' : ''}`}>
        {!isBlank && currentCard && (
          <>
            {currentCard.badgeNumber && (
              <div className="card-badge">{currentCard.badgeNumber}</div>
            )}
            <div className="card-header">{currentCard.headerText}</div>
            <div
              className="card-body"
              dangerouslySetInnerHTML={{ __html: currentCard.bodyHtml }}
            />
          </>
        )}
      </div>

      {/* Connection indicator - small, unobtrusive */}
      <div className={`output-connection ${connected ? 'connected' : 'disconnected'}`}>
        {connected ? '' : 'Reconnecting...'}
      </div>
    </div>
  );
}
