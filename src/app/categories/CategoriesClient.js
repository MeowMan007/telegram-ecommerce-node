'use client';

import { useState, useEffect } from 'react';

export default function CategoriesClient() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);

  const loadData = () => {
    fetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    await fetch('/api/admin/categories', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, name })
    });
    setName('');
    setEditingId(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? (Products will become uncategorized)')) return;
    await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your catalog into folders</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card" style={{ alignSelf: 'start' }}>
          <h3 style={{ marginBottom: '20px' }}>{editingId ? 'Edit Category' : 'Add Category'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g. Electronics"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              {editingId && (
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => { setEditingId(null); setName(''); }}>Cancel</button>
              )}
            </div>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Category List</h3>
          {categories.length === 0 ? (
            <div className="empty-state">No categories found.</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td><b>{c.name}</b></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-sm btn-info" onClick={() => { setEditingId(c.id); setName(c.name); }}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
