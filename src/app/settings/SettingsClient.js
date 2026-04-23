'use client';

import { useState, useEffect } from 'react';

export default function SettingsClient() {
  const [settings, setSettings] = useState({ upiId: '', usdtAddress: '', usdtNetwork: 'TRC20' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    if (res.ok) {
      setMessage('✅ Settings saved successfully!');
    } else {
      setMessage('❌ Failed to save settings.');
    }
    setSaving(false);
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure payment methods and bot options</p>
        </div>
      </div>

      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💳 UPI Payment Configuration
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Users who select UPI at checkout will be asked to send INR to this UPI ID and upload a screenshot.
          </p>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. yourname@okaxis"
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💰 USDT Payment Configuration
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Users who select USDT will be asked to send funds to this wallet address.
          </p>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">USDT Wallet Address</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. T..."
                value={settings.usdtAddress}
                onChange={(e) => setSettings({ ...settings, usdtAddress: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Network</label>
              <select
                className="form-select"
                value={settings.usdtNetwork}
                onChange={(e) => setSettings({ ...settings, usdtNetwork: e.target.value })}
              >
                <option value="TRC20">TRC20 (Tron)</option>
                <option value="ERC20">ERC20 (Ethereum)</option>
                <option value="BEP20">BEP20 (Binance Smart Chain)</option>
                <option value="Polygon">Polygon</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
