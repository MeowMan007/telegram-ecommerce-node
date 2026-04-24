'use client';

import { useState, useEffect } from 'react';

export default function ClientsClient() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyModal, setHistoryModal] = useState(null);

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
                <th>Purchases</th>
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
                    <button className="btn btn-sm btn-secondary" onClick={() => setHistoryModal(c)}>
                      View History
                    </button>
                  </td>
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

      {historyModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Purchase History: {historyModal.name || 'Unknown'}</h2>
            {historyModal.purchaseHistory ? (
              <div>
                {(() => {
                  try {
                    const history = JSON.parse(historyModal.purchaseHistory);
                    if (history.length === 0) return <p>No purchases yet.</p>;
                    return history.map((h, i) => (
                      <div key={i} style={{ padding: '10px', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '10px' }}>
                        <p><strong>Date:</strong> {new Date(h.date).toLocaleString()}</p>
                        <p><strong>Amount:</strong> ₹{h.amount}</p>
                        <ul>
                          {h.items.map((item, j) => (
                            <li key={j}>{item.name} (x{item.qty})</li>
                          ))}
                        </ul>
                      </div>
                    ));
                  } catch (e) {
                    return <p>Error parsing history.</p>;
                  }
                })()}
              </div>
            ) : (
              <p>No purchase history available.</p>
            )}
            <button className="btn btn-danger" style={{ marginTop: '20px', width: '100%' }} onClick={() => setHistoryModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
