'use client';

import { useState, useEffect } from 'react';

export default function PaymentsClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        // Filter only orders with submitted proofs that need review
        setOrders(data.filter(o => o.paymentStatus === 'PROOF_SUBMITTED'));
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const updatePaymentStatus = async (id, status) => {
    const newOrderStatus = status === 'VERIFIED' ? 'PROCESSED' : 'WAITING';
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: status, status: newOrderStatus })
    });
    loadData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Pending Payments</h1>
          <p className="page-subtitle">Review and approve customer payment proofs</p>
        </div>
      </div>

      <div className="grid-2">
        {orders.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <div className="empty-state">
              <div className="icon">🎉</div>
              <h3>All Caught Up!</h3>
              <p>No pending payment proofs to review right now.</p>
            </div>
          </div>
        ) : (
          orders.map(o => (
            <div key={o.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '18px' }}>Order #{o.id}</h3>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{o.client?.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-hover)' }}>₹{o.amount.toLocaleString()}</div>
                  <span className="badge purple">{o.paymentMethod}</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Telegram File ID (Proof):</p>
                <code style={{ fontSize: '11px', wordBreak: 'break-all', color: 'var(--info)' }}>{o.paymentProofId}</code>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  *View the actual photo in your Admin Telegram chat where the bot forwarded it.
                </p>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '10px' }}>
                <button 
                  className="btn btn-success" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => updatePaymentStatus(o.id, 'VERIFIED')}
                >
                  ✅ Approve
                </button>
                <button 
                  className="btn btn-danger" 
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => updatePaymentStatus(o.id, 'REJECTED')}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
