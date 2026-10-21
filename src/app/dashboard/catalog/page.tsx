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
  Search,
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
  trackStock?: boolean;
  stockQuantity?: number;
}

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('$');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Navigation & Modals state
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    displayOrder: '0',
  });
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    categoryId: '',
    price: '',
    description: '',
    sku: '',
    isAvailable: true,
    trackStock: false,
    stockQuantity: '0',
  });

  const loadData = async () => {
    try {
      const [catRes, prodRes, authRes] = await Promise.all([
        fetch('/api/catalog/categories'),
        fetch('/api/catalog/products'),
        fetch('/api/auth/me'),
      ]);

      if (catRes.ok && prodRes.ok) {
        const catData = await catRes.json();
        const prodData = await prodRes.json();
        setCategories(catData.categories || []);
        setProducts(prodData.products || []);
        if (prodData.currency) setCurrency(prodData.currency);
      }

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData.tenant?.currency) setCurrency(authData.tenant.currency);
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

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (typeof p.categoryId === 'string'
        ? p.categoryId === selectedCategory
        : p.categoryId?._id === selectedCategory);

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  });

  // Filter categories by search
  const filteredCategories = categories.filter((c) => {
    const q = categorySearchQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q);
  });

  // Category Actions (Full CRUD)
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        name: cat.name,
        displayOrder: (cat.displayOrder ?? 0).toString(),
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        displayOrder: categories.length.toString(),
      });
    }
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showMsg('error', 'Category name is required');
      return;
    }

    setSavingCategory(true);
    try {
      const url = '/api/catalog/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = {
        ...(editingCategory && { id: editingCategory._id }),
        name: categoryForm.name.trim(),
        displayOrder: parseInt(categoryForm.displayOrder, 10) || 0,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      setShowCategoryModal(false);
      showMsg('success', editingCategory ? 'Category updated successfully' : 'Category added to catalog');
      loadData();
    } catch (err: any) {
      showMsg('error', err.message || 'Failed to save category');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string, name?: string) => {
    const label = name ? ` "${name}"` : '';
    if (!confirm(`Are you sure you want to delete category${label}?`)) return;
    try {
      const res = await fetch(`/api/catalog/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete category');
      showMsg('success', 'Category deleted');
      if (selectedCategory === id) {
        setSelectedCategory('ALL');
      }
      loadData();
    } catch (err: any) {
      showMsg('error', err.message || 'Failed to delete category');
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
        isAvailable: product.isAvailable ?? true,
        trackStock: Boolean(product.trackStock),
        stockQuantity: (product.stockQuantity ?? 0).toString(),
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
        trackStock: false,
        stockQuantity: '10',
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
        trackStock: productForm.trackStock,
        stockQuantity: productForm.trackStock ? Math.max(0, parseInt(productForm.stockQuantity, 10) || 0) : 0,
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
      <div className="catalog-header">
        <div>
          <h1 className="catalog-title">
            Products &amp; Categories
          </h1>
        </div>

        <div className="catalog-actions">
          <button
            type="button"
            onClick={() => handleOpenCategoryModal()}
            className="btn btn-secondary btn-sm"
          >
            <Plus size={16} /> New Category
          </button>
          <button
            type="button"
            onClick={() => handleOpenProductModal()}
            className="btn btn-primary btn-sm"
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            background: feedback.type === 'success' ? 'var(--green-badge-bg)' : 'var(--moss-badge-bg)',
            border: `1px solid ${feedback.type === 'success' ? 'var(--green-badge-border)' : 'var(--moss-badge-border)'}`,
            color: 'var(--text-main)',
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.88rem',
            fontWeight: 500,
          }}
        >
          {feedback.type === 'success' ? <Check size={18} style={{ color: 'var(--primary)' }} /> : <AlertCircle size={18} style={{ color: '#ef4444' }} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Catalog Views Tab Switcher */}
      <div className="catalog-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`catalog-nav-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
        >
          <ShoppingBag size={16} />
          <span>Products &amp; Items ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`catalog-nav-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
        >
          <Layers size={16} />
          <span>Categories ({categories.length})</span>
        </button>
      </div>

      {/* VIEW 1: PRODUCTS & ITEMS */}
      {activeTab === 'products' && (
        <>
          {/* Search and Category Filter Bar */}
          <div className="glass-panel catalog-filter-bar">
        <div className="catalog-search-wrapper">
          <Search size={16} className="catalog-search-icon" />
          <input
            type="text"
            className="form-input catalog-search-input"
            placeholder="Search products or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="catalog-search-clear"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="catalog-category-filter-pills">
          <button
            type="button"
            className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'} catalog-pill-btn`}
            onClick={() => setSelectedCategory('ALL')}
          >
            All Items ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) =>
              typeof p.categoryId === 'string' ? p.categoryId === c._id : p.categoryId?._id === c._id
            ).length;
            return (
              <button
                key={c._id}
                type="button"
                className={`btn btn-sm ${selectedCategory === c._id ? 'btn-primary' : 'btn-secondary'} catalog-pill-btn`}
                onClick={() => setSelectedCategory(c._id)}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Categories Overview Bar */}
      <div className="glass-panel catalog-categories-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Catalog Categories ({categories.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.74rem', padding: '3px 8px' }}
          >
            Manage Categories
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {categories.length === 0 ? (
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              No categories created yet. Click &quot;New Category&quot; above to organize your catalog.
            </span>
          ) : (
            categories.map((cat) => (
              <div key={cat._id} className="catalog-category-tag">
                <Tag size={13} style={{ color: 'var(--primary)' }} />
                <span>{cat.name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenCategoryModal(cat)}
                    className="catalog-category-del-btn"
                    title="Edit category"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat._id, cat.name)}
                    className="catalog-category-del-btn"
                    title="Delete category"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Products Panel */}
      <div className="glass-panel catalog-products-panel">
        <div className="catalog-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              All Menu &amp; Catalog Items ({filteredProducts.length}{filteredProducts.length !== products.length ? ` of ${products.length}` : ''})
            </h3>
          </div>
          {filteredProducts.length !== products.length && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            {products.length === 0
              ? 'No products in catalog yet. Click "Add Product Item" to create your first item!'
              : 'No products match your current search or category filter.'}
          </div>
        ) : (
          <>
            {/* 1. Desktop Table (> 768px) */}
            <div className="catalog-desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>SKU</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Stock</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => (
                    <tr key={prod._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{prod.name}</div>
                        {prod.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                            {prod.description}
                          </div>
                        )}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {typeof prod.categoryId === 'object' ? prod.categoryId?.name : 'General'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                        {prod.sku || '—'}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--emerald)' }}>
                        {currency}{prod.price.toFixed(2)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(prod)}
                          className={`badge ${prod.isAvailable ? 'badge-pro' : 'badge-expired'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle availability"
                        >
                          {prod.isAvailable ? 'Available' : 'Unavailable'}
                        </button>
                      </td>
                      <td>
                        {prod.trackStock ? (
                          <span
                            className={`badge ${(prod.stockQuantity ?? 0) > 0 ? 'badge-pro' : 'badge-expired'}`}
                            style={{ fontWeight: 600 }}
                          >
                            {(prod.stockQuantity ?? 0) > 0
                              ? `${prod.stockQuantity} in stock`
                              : 'Out of stock'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Live Counter
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenProductModal(prod)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 10px' }}
                            title="Edit Product"
                            aria-label={`Edit ${prod.name}`}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod._id)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px 10px' }}
                            title="Delete Product"
                            aria-label={`Delete ${prod.name}`}
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

            {/* 2. Tablet & Mobile Cards (<= 768px) */}
            <div className="catalog-mobile-cards">
              {filteredProducts.map((prod) => {
                const categoryName = typeof prod.categoryId === 'object' ? prod.categoryId?.name : 'General';
                return (
                  <div key={prod._id} className="catalog-mobile-card">
                    <div className="catalog-card-header">
                      <div>
                        <h4 className="catalog-card-title">{prod.name}</h4>
                        <div className="catalog-card-category-badge">
                          <Tag size={11} /> {categoryName}
                        </div>
                      </div>
                      <div className="catalog-card-price">
                        {currency}{prod.price.toFixed(2)}
                      </div>
                    </div>

                    {(prod.description || prod.sku) && (
                      <div className="catalog-card-meta">
                        {prod.sku && (
                          <span className="catalog-card-sku">SKU: {prod.sku}</span>
                        )}
                        {prod.description && (
                          <p className="catalog-card-desc">{prod.description}</p>
                        )}
                      </div>
                    )}

                    <div className="catalog-card-footer">
                      <div className="catalog-card-status-badges">
                        <button
                          type="button"
                          onClick={() => handleToggleAvailability(prod)}
                          className={`badge ${prod.isAvailable ? 'badge-pro' : 'badge-expired'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Tap to toggle live counter availability"
                        >
                          {prod.isAvailable ? 'Available' : 'Unavailable'}
                        </button>

                        {prod.trackStock ? (
                          <span className={`badge ${(prod.stockQuantity ?? 0) > 0 ? 'badge-pro' : 'badge-expired'}`}>
                            {(prod.stockQuantity ?? 0) > 0 ? `${prod.stockQuantity} in stock` : 'Out of stock'}
                          </span>
                        ) : (
                          <span className="catalog-card-counter-tag">
                            Live Counter
                          </span>
                        )}
                      </div>

                      <div className="catalog-card-actions">
                        <button
                          type="button"
                          onClick={() => handleOpenProductModal(prod)}
                          className="btn btn-secondary btn-sm catalog-action-btn"
                          title="Edit Product"
                          aria-label={`Edit ${prod.name}`}
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod._id)}
                          className="btn btn-danger btn-sm catalog-action-btn"
                          title="Delete Product"
                          aria-label={`Delete ${prod.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      </>
      )}

      {/* VIEW 2: CATEGORIES MANAGEMENT (FULL CRUD) */}
      {activeTab === 'categories' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Categories Search & Action Bar */}
          <div className="glass-panel catalog-filter-bar">
            <div className="catalog-search-wrapper" style={{ flex: 1 }}>
              <Search size={16} className="catalog-search-icon" />
              <input
                type="text"
                className="form-input catalog-search-input"
                placeholder="Search categories..."
                value={categorySearchQuery}
                onChange={(e) => setCategorySearchQuery(e.target.value)}
              />
              {categorySearchQuery && (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery('')}
                  className="catalog-search-clear"
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleOpenCategoryModal()}
              className="btn btn-primary btn-sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Plus size={15} /> Add Category
            </button>
          </div>

          {/* Categories Management Panel */}
          <div className="glass-panel catalog-products-panel">
            <div className="catalog-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Manage Categories ({filteredCategories.length}{filteredCategories.length !== categories.length ? ` of ${categories.length}` : ''})
                </h3>
              </div>
              {filteredCategories.length !== categories.length && (
                <button
                  type="button"
                  onClick={() => setCategorySearchQuery('')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  Reset Filter
                </button>
              )}
            </div>

            {filteredCategories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Layers size={36} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  No categories found
                </h4>
                <p style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                  {categorySearchQuery ? 'No categories matched your search term.' : 'Create categories to organize your menu and catalog items.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenCategoryModal()}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={15} /> Create First Category
                </button>
              </div>
            ) : (
              <div className="catalog-category-grid">
                {filteredCategories.map((cat) => {
                  const linkedCount = products.filter((p) =>
                    typeof p.categoryId === 'string' ? p.categoryId === cat._id : p.categoryId?._id === cat._id
                  ).length;

                  return (
                    <div key={cat._id} className="catalog-category-manage-card">
                      <div className="catalog-category-card-top">
                        <div>
                          <div className="catalog-category-card-title">
                            {cat.name}
                          </div>
                          <div className="catalog-category-card-count" style={{ marginTop: '6px' }}>
                            <Tag size={13} style={{ color: 'var(--primary)' }} />
                            <span>{linkedCount} {linkedCount === 1 ? 'item' : 'items'} in catalog</span>
                          </div>
                        </div>
                        <span
                          className="badge"
                          style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-muted)',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          Order #{cat.displayOrder ?? 0}
                        </span>
                      </div>

                      <div className="catalog-category-card-footer">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat._id);
                            setActiveTab('products');
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.76rem', padding: '5px 10px' }}
                          title="View all items in this category"
                        >
                          View Items ({linkedCount})
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryModal(cat)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px 9px' }}
                            title="Edit category name and order"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat._id, cat.name)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px 9px' }}
                            title="Delete category"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal (Create & Edit) */}
      {showCategoryModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h3>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Hot Beverages, Desserts, Starters"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Display Order (Sort Index)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="form-input"
                  placeholder="0"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Lower numbers appear first in POS catalog category tabs.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="btn btn-secondary"
                  disabled={savingCategory}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingCategory}>
                  {savingCategory ? 'Saving...' : editingCategory ? 'Update Category' : 'Save Category'}
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
              {editingProduct ? 'Edit Product' : 'New Product'}
            </h3>
            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Item name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="catalog-modal-grid">
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
                  <label className="form-label">Price ({currency})</label>
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
                  placeholder="SKU or product code"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="Product description"
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                />
              </div>

              {/* Order Availability & Stock Settings */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px', marginBottom: '8px' }}>
                {/* Available to order toggle card */}
                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      Available to order
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: productForm.isAvailable ? 'var(--primary)' : 'var(--text-muted)',
                        marginTop: '2px',
                        fontWeight: productForm.isAvailable ? 600 : 400,
                      }}
                    >
                      {productForm.isAvailable
                        ? 'Live counter preparation active'
                        : 'Item marked unavailable to customers'}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={productForm.isAvailable}
                    onClick={() => setProductForm({ ...productForm, isAvailable: !productForm.isAvailable })}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      background: productForm.isAvailable ? 'var(--primary)' : 'var(--border-medium)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      padding: '2px',
                      transition: 'background-color 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        transform: productForm.isAvailable ? 'translateX(22px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      }}
                    />
                  </button>
                </div>

                {/* Available stock toggle card */}
                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      Available stock
                    </div>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: productForm.trackStock ? 'var(--primary)' : 'var(--text-muted)',
                        marginTop: '2px',
                        fontWeight: productForm.trackStock ? 600 : 400,
                      }}
                    >
                      {productForm.trackStock ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={productForm.trackStock}
                    onClick={() => setProductForm({ ...productForm, trackStock: !productForm.trackStock })}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '14px',
                      background: productForm.trackStock ? 'var(--primary)' : 'var(--border-medium)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      padding: '2px',
                      transition: 'background-color 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        transform: productForm.trackStock ? 'translateX(22px)' : 'translateX(0px)',
                        transition: 'transform 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
                      }}
                    />
                  </button>
                </div>

                {/* Define stock quantity input when Available stock is enabled */}
                {productForm.trackStock && (
                  <div
                    style={{
                      background: 'var(--green-badge-bg)',
                      border: '1px solid var(--green-badge-border)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                    }}
                  >
                    <label className="form-label" style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-main)' }}>
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className="form-input"
                      placeholder="0"
                      value={productForm.stockQuantity}
                      onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                      required={productForm.trackStock}
                    />
                  </div>
                )}
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
