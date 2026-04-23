'use client';

import { useState, useEffect } from 'react';

export default function ProductsClient() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const initialForm = { name: '', description: '', price: '', photoUrl: '', categoryId: '', stockQty: 0, isActive: true };
  const [form, setForm] = useState(initialForm);

  const loadData = () => {
    Promise.all([
      fetch('/api/admin/products').then(res => res.json()),
      fetch('/api/admin/categories').then(res => res.json())
    ]).then(([prodData, catData]) => {
      setProducts(prodData);
      setCategories(catData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setForm({ ...product, categoryId: product.categoryId || '' });
    } else {
      setEditingProduct(null);
      setForm(initialForm);
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
    const method = editingProduct ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    setShowModal(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    loadData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your catalog items</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          + Add Product
        </button>
      </div>

      <div className="card">
        {products.length === 0 ? (
          <div className="empty-state">No products found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>
                    <img src={p.photoUrl || 'https://via.placeholder.com/50'} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                  </td>
                  <td><b>{p.name}</b></td>
                  <td>{p.category?.name || '—'}</td>
                  <td>₹{p.price.toLocaleString()}</td>
                  <td>
                    {p.stockQty === 0 ? <span className="badge purple">Unlimited</span> : 
                     p.stockQty < 5 ? <span className="badge danger">{p.stockQty} left</span> :
                     <span className="badge info">{p.stockQty}</span>}
                  </td>
                  <td>
                    <span className={`badge ${p.isActive ? 'success' : 'danger'}`}>
                      {p.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-sm btn-info" onClick={() => handleOpenModal(p)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
            
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input type="text" className="form-input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input type="number" className="form-input" required value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.categoryId} onChange={e => setForm({...form, categoryId: e.target.value})}>
                    <option value="">No Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Photo URL</label>
                <input type="text" className="form-input" required value={form.photoUrl} onChange={e => setForm({...form, photoUrl: e.target.value})} />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" required value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Stock Qty (0 = unlimited)</label>
                  <input type="number" className="form-input" min="0" value={form.stockQty} onChange={e => setForm({...form, stockQty: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '12px' }}>Status</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} style={{ width: '18px', height: '18px' }} />
                    Visible in Bot Catalog
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
