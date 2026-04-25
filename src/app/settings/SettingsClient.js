'use client';

import { useState, useEffect } from 'react';

export default function SettingsClient() {
  const [settings, setSettings] = useState({ upiId: '', upiQrUrl: '', usdtAddress: '', usdtNetwork: 'TRC20' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMessage, setPwMessage] = useState('');
  const [changingPw, setChangingPw] = useState(false);

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

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setChangingPw(true);
    setPwMessage('');

    const res = await fetch('/api/admin/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      setPwMessage('✅ Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      setPwMessage(`❌ ${data.error || 'Failed to change password.'}`);
    }
    setChangingPw(false);
    setTimeout(() => setPwMessage(''), 4000);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure payment methods, bot options & security</p>
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
            Users who select UPI at checkout will see this UPI ID and QR code.
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

            <div className="form-group">
              <label className="form-label">UPI QR Code Image URL</label>
              <input
                type="text"
                className="form-input"
                placeholder="https://example.com/qr.png"
                value={settings.upiQrUrl || ''}
                onChange={(e) => setSettings({ ...settings, upiQrUrl: e.target.value })}
              />
              <p style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px' }}>
                Upload your QR image to any image host and paste the URL here
              </p>
            </div>
            
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💰 Binance / USDT Configuration
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
            Users who select USDT will be asked to send funds to this wallet address via Binance.
          </p>

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">USDT / Binance Wallet Address</label>
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

      {/* Password Change Section */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔒 Change Password
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          Update your admin password. Username cannot be changed.
        </p>

        {pwMessage && (
          <div className={`alert ${pwMessage.includes('✅') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: '16px' }}>
            {pwMessage}
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={changingPw}>
            {changingPw ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
