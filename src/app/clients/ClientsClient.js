'use client';

import { useState, useEffect } from 'react';

export default function ClientsClient() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch('/api/admin/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Users who have interacted with your bot</p>
        </div>
      </div>

      <div className="card">
        {clients.length === 0 ? (
          <div className="empty-state">No clients found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Chat ID</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td><b>{c.name || 'Unknown'}</b></td>
                  <td><code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.chatId}</code></td>
                  <td>{c.phoneNumber || '—'}</td>
                  <td>
                    <span className={`badge ${c.isActive ? 'success' : 'danger'}`}>
                      {c.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                  <td>
                    {c.isActive && (
                      <a href={`https://t.me/`} onClick={(e) => {
                        e.preventDefault();
                        alert(`To chat with this user, go to your Telegram admin account and send: /chat ${c.chatId}`);
                      }} className="btn btn-sm btn-primary">
                        💬 Start Chat
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
