'use client';

import { useState, useEffect } from 'react';

export default function AnnouncementsClient() {
  const [history, setHistory] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const loadHistory = () => {
    fetch('/api/admin/announcements')
      .then((res) => res.json())
      .then((data) => setHistory(data));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !confirm('Are you sure you want to send this message to ALL active users?')) return;
    
    setSending(true);
    setResult(null);

    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    setResult(data);
    setText('');
    setSending(false);
    loadHistory();
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-subtitle">Broadcast messages to all users</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>📢 Compose Message</h3>
          
          {result && (
            <div className="alert alert-success">
              ✅ Broadcast complete!<br/>
              Sent: {result.sent} | Failed: {result.failed} | Blocked: {result.blocked}
            </div>
          )}

          <form onSubmit={handleSend}>
            <div className="form-group">
              <label className="form-label">Message Text (HTML supported)</label>
              <textarea
                className="form-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message here... Use <b>text</b> for bold, <i>text</i> for italic."
                required
                disabled={sending}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '8px' }}>
                You can also send broadcasts via Telegram by typing <code>/announce [message]</code>
              </small>
            </div>
            <button type="submit" className="btn btn-primary" disabled={sending || !text.trim()}>
              {sending ? 'Sending Broadcast...' : '📤 Send to All Users'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>📜 Broadcast History</h3>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {history.length === 0 ? (
              <div className="empty-state">No announcements sent yet.</div>
            ) : (
              history.map((a) => (
                <div key={a.id} style={{ 
                  padding: '16px', 
                  borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-glass)',
                  borderRadius: '10px',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="badge purple">Sent: {a.totalSent} users</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(a.sentAt).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                    {a.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
