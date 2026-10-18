'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  ShoppingBag,
  Check,
  X,
  AlertCircle,
  Tag,
  DollarSign,
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
  displayOrder: number;
}

interface Product {
  _id: string;
  categoryId: { _id: string; name: string } | string;
  name: string;
  description: string;
  price: number;
  sku: string;
  isAvailable: boolean;
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    sku: '',
    isAvailable: true,
  });

  const loadData = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch('/api/catalog/products'),
      ]);

      if (catRes.ok && prodRes.ok) {
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData.categories || []);
        setProducts(prodData.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Category Actions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch('/api/catalog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setNewCategoryName('');
      setShowCategoryModal(false);
      showMsg('success', 'Category added to catalog');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/catalog/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');
      showMsg('success', 'Category deleted');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  // Product Actions
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        categoryId: typeof product.categoryId === 'string' ? product.categoryId : product.categoryId?._id,
        price: product.price.toString(),
        description: product.description || '',
        sku: product.sku || '',
        isAvailable: product.isAvailable,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        categoryId: categories[0]?._id || '',
        price: '',
        description: '',
        sku: '',
        isAvailable: true,
      });
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.categoryId || !productForm.price) {
      showMsg('error', 'Name, Category, and Price are required');
      return;
    }

    try {
      const url = '/api/catalog/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const body = {
        ...(editingProduct && { id: editingProduct._id }),
        ...productForm,
        price: parseFloat(productForm.price),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setShowProductModal(false);
      showMsg('success', editingProduct ? 'Product updated' : 'Product added to catalog');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  const handleToggleAvailability = async (product: Product) => {
    try {
      const res = await fetch('/api/catalog/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: product._id,
          isAvailable: !product.isAvailable,
        }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p._id === product._id ? { ...p, isAvailable: !p.isAvailable } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/catalog/products?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showMsg('success', 'Product removed');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  };

  return (
    <div>
      {/* Top Header */}
      <div
        className="catalog-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Catalog & Menu Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Configure your item categories, pricing, descriptions, and POS availability
          </p>
        </div>

        <div className="catalog-actions" style={{ display: 'flex', gap: '12px' }}>
          <button
            type="button"
            onClick={() => setShowCategoryModal(true)}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={16} /> New Category
          </button>
          <button
            type="button"
            onClick={() => handleOpenProductModal()}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Add Product Item
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(6, 78, 59, 0.5)',
            border: `1px solid ${feedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(52, 211, 153, 0.4)'}`,
            color: feedback.type === 'success' ? '#34d399' : '#a7f3d0',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Categories Overview Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Layers size={18} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Catalog Categories ({categories.length})</h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {categories.map((cat) => (
            <div
              key={cat._id}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem',
              }}
            >
              <Tag size={13} style={{ color: 'var(--text-muted)' }} />
              <span>{cat.name}</span>
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat._id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
                title="Delete category"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>All Menu & Catalog Items ({products.length})</h3>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No products in catalog yet. Click &quot;Add Product Item&quot; to create your first item!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Item</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>SKU</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 20px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((prod) => (
                  <tr
                    key={prod._id}
                    style={{ borderBottom: '1px solid var(--border-subtle)' }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{prod.name}</div>
                      {prod.description && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                          {prod.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                      {typeof prod.categoryId === 'object' ? prod.categoryId?.name : 'General'}
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {prod.sku || '—'}
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--emerald)' }}>
                      ${prod.price.toFixed(2)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(prod)}
                        className={`badge ${prod.isAvailable ? 'badge-pro' : 'badge-expired'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                      >
                        {prod.isAvailable ? 'In Stock (Live)' : 'Out of Stock'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenProductModal(prod)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod._id)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 10px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>Add Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Desserts, Hot Drinks, Services"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              {editingProduct ? 'Edit Product Item' : 'New Product Item'}
            </h3>
            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Double Espresso, Silk Scarf"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="9.99"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Code (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. COF-01"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Ingredients, size, or special instructions"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
