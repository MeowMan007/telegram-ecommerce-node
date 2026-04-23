'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardClient() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="empty-state">Loading dashboard...</div>;
  }

  // Chart config for Revenue
  const revenueChartData = {
    labels: Object.keys(data.dailyRevenue || {}),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: Object.values(data.dailyRevenue || {}),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
    },
  };

  // Chart config for Order Status
  const statusColors = {
    WAITING: '#f59e0b',
    PROCESSED: '#3b82f6',
    COMPLETED: '#10b981',
    CANCELED: '#ef4444',
  };

  const statusChartData = {
    labels: data.ordersByStatus?.map((s) => s.status) || [],
    datasets: [
      {
        data: data.ordersByStatus?.map((s) => s.count) || [],
        backgroundColor: data.ordersByStatus?.map((s) => statusColors[s.status] || '#6366f1') || [],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#e2e8f0' } },
    },
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your shop\'s performance</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">📦</div>
          <div className="stat-value">{data.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">💰</div>
          <div className="stat-value">₹{data.totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{data.activeClients}</div>
          <div className="stat-label">Active Clients</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">💳</div>
          <div className="stat-value">{data.pendingPayments}</div>
          <div className="stat-label">Pending Payments</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Revenue Trend (30 Days)</h3>
          <div style={{ height: '300px' }}>
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Order Status</h3>
          <div style={{ height: '300px' }}>
            <Doughnut data={statusChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '20px', fontSize: '16px' }}>Recent Orders</h3>
        {data.recentOrders?.length === 0 ? (
          <div className="empty-state">No recent orders found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders?.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.client?.name || 'Unknown'}</td>
                    <td>{new Date(order.createdDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'COMPLETED' ? 'success' :
                        order.status === 'CANCELED' ? 'danger' :
                        order.status === 'PROCESSED' ? 'info' : 'warning'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        order.paymentStatus === 'VERIFIED' ? 'success' :
                        order.paymentStatus === 'REJECTED' ? 'danger' :
                        order.paymentStatus === 'PROOF_SUBMITTED' ? 'warning' : ''
                      }`}>
                        {order.paymentMethod ? `${order.paymentMethod} - ` : ''}
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td><b>₹{order.amount.toLocaleString()}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
