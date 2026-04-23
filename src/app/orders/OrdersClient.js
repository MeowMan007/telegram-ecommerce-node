'use client';

import { useState, useEffect } from 'react';

export default function OrdersClient() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id, status) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    loadData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Manage customer orders and statuses</p>
        </div>
      </div>

      <div className="card">
        {orders.length === 0 ? (
          <div className="empty-state">No orders found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Change Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td><b>#{o.id}</b></td>
                  <td>{new Date(o.createdDate).toLocaleString()}</td>
                  <td>
                    {o.client?.name || 'Unknown'}
                    <br/>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {o.client?.chatId}</span>
                  </td>
                  <td><b>₹{o.amount.toLocaleString()}</b></td>
                  <td>
                    <span className={`badge ${
                      o.paymentStatus === 'VERIFIED' ? 'success' :
                      o.paymentStatus === 'REJECTED' ? 'danger' :
                      o.paymentStatus === 'PROOF_SUBMITTED' ? 'warning' : ''
                    }`}>
                      {o.paymentMethod ? `${o.paymentMethod}: ` : ''}
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      o.status === 'COMPLETED' ? 'success' :
                      o.status === 'CANCELED' ? 'danger' :
                      o.status === 'PROCESSED' ? 'info' : 'warning'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td>
                    <select 
                      className="form-select" 
                      style={{ padding: '6px 10px', fontSize: '13px', width: '130px' }}
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                    >
                      <option value="WAITING">WAITING</option>
                      <option value="PROCESSED">PROCESSED</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELED">CANCELED</option>
                    </select>
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
