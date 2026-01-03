import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import api from '../services/api';
import './UserPage.css';

const quillModules = {
  toolbar: [
    [{ 'size': ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline'],
    [{ 'align': [] }],
    ['clean']
  ]
};

const quillFormats = ['size', 'bold', 'italic', 'underline', 'align'];

export default function UserPage() {
  const { user, logout, isAdmin } = useAuth();
  const { connected, connectionCount } = useSocket();
  const navigate = useNavigate();

  const [headerText, setHeaderText] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [presets, setPresets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetNumber, setPresetNumber] = useState('');
  const [presetSubject, setPresetSubject] = useState('');

  const quillRef = useRef(null);

  useEffect(() => {
    loadPresets();
  }, []);

  async function loadPresets() {
    try {
      const response = await api.get('/presets');
      setPresets(response.data.presets);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  }

  async function handleSend() {
    if (!headerText.trim()) {
      alert('Please enter a header');
      return;
    }

    setSending(true);
    try {
      const quill = quillRef.current?.getEditor();
      const bodyContent = quill ? quill.getContents() : { ops: [] };

      await api.post('/cards/send', {
        header_text: headerText,
        body_content: bodyContent,
        body_html: bodyHtml,
        badge_number: badgeNumber || null,
        preset_id: selectedPreset?.id || null
      });
    } catch (error) {
      alert('Failed to send card: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    try {
      await api.post('/cards/clear');
    } catch (error) {
      alert('Failed to clear card: ' + (error.response?.data?.error || error.message));
    }
  }

  function handleNewCard() {
    setHeaderText('');
    setBadgeNumber('');
    setBodyHtml('');
    setSelectedPreset(null);
  }

  function loadPreset(preset) {
    setHeaderText(preset.header_text);
    setBadgeNumber(preset.badge_number || '');
    setBodyHtml(preset.body_html);
    setSelectedPreset(preset);

    // Load Quill delta if available
    if (preset.body_content && quillRef.current) {
      const quill = quillRef.current.getEditor();
      const content = typeof preset.body_content === 'string'
        ? JSON.parse(preset.body_content)
        : preset.body_content;
      quill.setContents(content);
    }
  }

  async function handleSavePreset() {
    if (!presetNumber || !presetSubject.trim()) {
      alert('Please enter preset number and subject');
      return;
    }

    setSaving(true);
    try {
      const quill = quillRef.current?.getEditor();
      const bodyContent = quill ? quill.getContents() : { ops: [] };

      const data = {
        preset_number: parseInt(presetNumber),
        subject: presetSubject,
        header_text: headerText,
        body_content: bodyContent,
        body_html: bodyHtml,
        badge_number: badgeNumber || null
      };

      if (selectedPreset && selectedPreset.preset_number === parseInt(presetNumber)) {
        await api.put(`/presets/${selectedPreset.id}`, data);
      } else {
        await api.post('/presets', data);
      }

      setShowSaveModal(false);
      setPresetNumber('');
      setPresetSubject('');
      loadPresets();
    } catch (error) {
      alert('Failed to save preset: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeletePreset(preset) {
    if (!confirm(`Delete preset #${preset.preset_number} - ${preset.subject}?`)) {
      return;
    }

    try {
      await api.delete(`/presets/${preset.id}`);
      loadPresets();
      if (selectedPreset?.id === preset.id) {
        setSelectedPreset(null);
      }
    } catch (error) {
      alert('Failed to delete preset: ' + (error.response?.data?.error || error.message));
    }
  }

  function openSaveModal() {
    setPresetNumber(selectedPreset?.preset_number?.toString() || '');
    setPresetSubject(selectedPreset?.subject || '');
    setShowSaveModal(true);
  }

  const filteredPresets = presets.filter(p =>
    searchQuery === '' ||
    p.preset_number.toString().includes(searchQuery) ||
    p.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="user-page">
      <header className="user-header">
        <div className="header-left">
          <h1>Broadcast Cards</h1>
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          {connected && connectionCount.outputs > 0 && (
            <span className="output-count">{connectionCount.outputs} output{connectionCount.outputs !== 1 ? 's' : ''} connected</span>
          )}
        </div>
        <div className="header-right">
          <span className="user-info">{user?.username} ({user?.role})</span>
          {isAdmin && (
            <button className="btn btn-secondary" onClick={() => navigate('/admin')}>
              Admin
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="user-content">
        <aside className="preset-sidebar">
          <h2>Presets</h2>
          <input
            type="text"
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="preset-search"
          />
          <div className="preset-list">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                className={`preset-item ${selectedPreset?.id === preset.id ? 'selected' : ''}`}
                onClick={() => loadPreset(preset)}
              >
                <span className="preset-number">#{preset.preset_number}</span>
                <span className="preset-subject">{preset.subject}</span>
                <button
                  className="preset-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePreset(preset);
                  }}
                >
                  x
                </button>
              </div>
            ))}
            {filteredPresets.length === 0 && (
              <p className="no-presets">No presets found</p>
            )}
          </div>
        </aside>

        <main className="editor-main">
          <div className="card-editor">
            <div className="editor-row">
              <div className="editor-field header-field">
                <label>Header</label>
                <input
                  type="text"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="PROMO #1 - TITLE HERE"
                />
              </div>
              <div className="editor-field badge-field">
                <label>Badge #</label>
                <input
                  type="text"
                  value={badgeNumber}
                  onChange={(e) => setBadgeNumber(e.target.value)}
                  placeholder="#1"
                />
              </div>
            </div>

            <div className="editor-field">
              <label>Body</label>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={bodyHtml}
                onChange={setBodyHtml}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Enter card content..."
              />
            </div>
          </div>

          <div className="card-preview-container">
            <h3>Preview</h3>
            <div className="card-preview">
              {badgeNumber && <div className="preview-badge">{badgeNumber}</div>}
              <div className="preview-header">{headerText || 'Header'}</div>
              <div
                className="preview-body"
                dangerouslySetInnerHTML={{ __html: bodyHtml || '<p>Body content...</p>' }}
              />
            </div>
          </div>

          <div className="action-bar">
            <button className="btn btn-secondary" onClick={handleNewCard}>
              New Card
            </button>
            <button className="btn btn-secondary" onClick={openSaveModal}>
              Save Preset
            </button>
            <button className="btn btn-danger btn-large" onClick={handleClear}>
              Clear Output
            </button>
            <button
              className="btn btn-primary btn-large"
              onClick={handleSend}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send to Output'}
            </button>
          </div>
        </main>
      </div>

      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Save Preset</h3>
            <div className="form-group">
              <label>Preset Number</label>
              <input
                type="number"
                value={presetNumber}
                onChange={(e) => setPresetNumber(e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={presetSubject}
                onChange={(e) => setPresetSubject(e.target.value)}
                placeholder="TGL Next Match"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSavePreset} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
