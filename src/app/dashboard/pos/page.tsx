'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Phone,
  User,
  CheckCircle2,
  Copy,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  categoryId: string | { _id: string; name: string };
  name: string;
  description: string;
  price: number;
  sku: string;
  isAvailable: boolean;
}

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export default function POSTerminalPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID_CASH');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Success Modal
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    whatsappUrl: string;
    rawReceipt: string;
    totalAmount: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Fetch initial catalog
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/catalog/categories'),
          fetch('/api/catalog/products?availableOnly=true'),
        ]);

        if (catRes.ok && prodRes.ok) {
          const catData = await catRes.json();
          const prodData = await prodRes.json();
          setCategories(catData.categories || []);
          setProducts(prodData.products || []);
        }
      } catch (err) {
        console.error('Failed to load POS catalog:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (typeof p.categoryId === 'string'
        ? p.categoryId === selectedCategory
        : p.categoryId?._id === selectedCategory);

    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product._id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product._id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal: Number(((item.quantity + 1) * item.unitPrice).toFixed(2)),
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            productName: product.name,
            unitPrice: product.price,
            quantity: 1,
            lineTotal: product.price,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: newQty,
              lineTotal: Number((newQty * item.unitPrice).toFixed(2)),
            };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerPhone('');
    setCustomerName('');
    setOrderError(null);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const totalAmount = Number((subtotal + taxAmount).toFixed(2));

  // Submit Order & Dispatch WhatsApp Link
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setOrderError('Cart is empty. Please select products.');
      return;
    }

    if (!customerPhone.trim()) {
      setOrderError('Please enter the customer WhatsApp phone number.');
      return;
    }

    setOrderError(null);
    setCreatingOrder(true);

    try {
      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Valued Customer',
          customerPhone: customerPhone.trim(),
          items: cart,
          tax: taxAmount,
          paymentStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to generate order');
      }

      setCompletedOrder({
        orderNumber: data.order.orderNumber,
        whatsappUrl: data.whatsappUrl,
        rawReceipt: data.rawReceiptText,
        totalAmount: data.order.totalAmount,
      });

      // Clear the active cart
      clearCart();
    } catch (err: any) {
      setOrderError(err.message || 'Error creating order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleCopyReceipt = () => {
    if (completedOrder) {
      navigator.clipboard.writeText(completedOrder.rawReceipt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    if (completedOrder) {
      window.open(completedOrder.whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div>
      <div
        className="pos-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Product Catalog & Fast Grid */}
        <div>
          {/* Search & Category Filter Header */}
          <div className="glass-panel" style={{ padding: '16px', marginBottom: '18px' }}>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Search catalog items by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              >
                All Products ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`btn btn-sm ${selectedCategory === cat._id ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Items Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Loading catalog items...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
                No items found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', margin: '0 auto 16px' }}>
                {searchQuery
                  ? 'No products matched your search keyword.'
                  : 'Your catalog is empty. Head over to the Catalog tab to add your first menu items!'}
              </p>
            </div>
          ) : (
            <div className="pos-grid">
              {filteredProducts.map((prod) => (
                <div
                  key={prod._id}
                  className="pos-item-card"
                  onClick={() => addToCart(prod)}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {prod.sku || 'SKU'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, marginBottom: '6px' }}>
                      {prod.name}
                    </div>
                    {prod.description && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {prod.description}
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '12px',
                      paddingTop: '8px',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--emerald)' }}>
                      ${prod.price.toFixed(2)}
                    </span>
                    <span
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: 'rgba(37, 211, 102, 0.2)',
                        color: 'var(--whatsapp)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={16} />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Live Sticky Cart & Checkout */}
        <div
          className="glass-panel pos-cart-panel"
          style={{
            padding: '24px',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} style={{ color: 'var(--whatsapp)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Current Bill Cart</h2>
              <span className="badge badge-admin" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Trash2 size={14} /> Clear
              </button>
            )}
          </div>

          {orderError && (
            <div
              style={{
                background: 'rgba(6, 78, 59, 0.5)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#a7f3d0',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
              }}
            >
              <AlertCircle size={16} />
              <span>{orderError}</span>
            </div>
          )}

          {/* Cart Item Rows */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', maxHeight: '240px', paddingRight: '4px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                Tap items on the left to add them to this order bill.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.productName}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ${item.unitPrice.toFixed(2)} each
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Qty controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--bg-input)',
                          padding: '2px 4px',
                          borderRadius: '6px',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, -1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.productId, 1)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: '55px', textAlign: 'right' }}>
                        ${item.lineTotal.toFixed(2)}
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '2px',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '12px',
              marginBottom: '16px',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            {taxRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                <span>Tax ({taxRate}%)</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span>Total Bill</span>
              <span style={{ color: 'var(--emerald)' }}>${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer & WhatsApp Input Form */}
          <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>
                Customer WhatsApp Phone <span style={{ color: 'var(--whatsapp)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--whatsapp)',
                  }}
                />
                <input
                  type="tel"
                  className="form-input"
                  style={{ paddingLeft: '36px', fontSize: '0.9rem', padding: '9px 12px 9px 36px' }}
                  placeholder="+1 (555) 019-2834"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pos-checkout-row" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '8px 10px' }}
                  placeholder="e.g. John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem' }}>
                  Payment Method
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.85rem', padding: '8px 10px' }}
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="PAID_CASH">Cash</option>
                  <option value="PAID_ONLINE">Online / Card</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-whatsapp"
              style={{ width: '100%', marginTop: '6px', padding: '12px' }}
              disabled={creatingOrder || cart.length === 0}
            >
              <MessageSquare size={18} />
              {creatingOrder ? 'Generating Receipt...' : 'Create Order & Dispatch WhatsApp'}
            </button>
          </form>
        </div>
      </div>

      {/* Post-Order WhatsApp Success Modal */}
      {completedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(37, 211, 102, 0.15)',
                  color: 'var(--whatsapp)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Order Created Successfully!</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Receipt #{completedOrder.orderNumber} is ready for customer dispatch
              </p>
            </div>

            {/* Formatted Receipt Code Box */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: '12px',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                whiteSpace: 'pre-line',
                maxHeight: '220px',
                overflowY: 'auto',
                marginBottom: '20px',
                lineHeight: 1.45,
              }}
            >
              {completedOrder.rawReceipt}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="btn btn-whatsapp btn-lg"
                style={{ width: '100%' }}
              >
                <MessageSquare size={20} /> Open in WhatsApp Web / App <ExternalLink size={16} />
              </button>

              <div className="receipt-modal-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="btn btn-secondary"
                >
                  <Copy size={16} /> {copied ? 'Copied!' : 'Copy Text'}
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedOrder(null)}
                  className="btn btn-secondary"
                >
                  Start Next Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
