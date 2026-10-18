'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Share2,
  RotateCcw,
  Layers,
  CreditCard,
  X,
  Check,
} from 'lucide-react';
import { useCountry } from '@/context/CountryContext';

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
  trackStock?: boolean;
  stockQuantity?: number;
}

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export default function OrderCreationPage() {
  const { country } = useCountry();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('$');

  // Cart & Customer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID_CASH');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Post-Order Sharing Modal
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    whatsappUrl: string;
    rawReceipt: string;
    totalAmount: number;
    phone: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  // Load Catalog Items
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [catRes, prodRes, authRes] = await Promise.all([
          fetch('/api/catalog/categories'),
          fetch('/api/catalog/products?availableOnly=true'),
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
        console.error('Failed to load catalog:', err);
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
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.trackStock) {
      const stock = product.stockQuantity ?? 0;
      if (stock <= 0) {
        setOrderError(`${product.name} is currently out of stock.`);
        return;
      }
      const existing = cart.find((item) => item.productId === product._id);
      if (existing && existing.quantity >= stock) {
        setOrderError(`Cannot add more than ${stock} units for ${product.name} (stock limit reached).`);
        return;
      }
    }

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
    if (delta > 0) {
      const prod = products.find((p) => p._id === productId);
      if (prod && prod.trackStock) {
        const item = cart.find((i) => i.productId === productId);
        const currentQty = item ? item.quantity : 0;
        const maxStock = prod.stockQuantity ?? 0;
        if (currentQty + delta > maxStock) {
          setOrderError(`Only ${maxStock} units in stock for ${prod.name}.`);
          return;
        }
      }
    }

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

  // Get item count in cart
  const getItemQuantityInCart = (productId: string) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const totalAmount = subtotal;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Order & Dispatch WhatsApp Link
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setOrderError('Please select at least one item from the catalog.');
      return;
    }

    const dialDigits = country.dialCode.replace(/\D/g, '');
    let subscriberDigits = customerPhone.replace(/\D/g, '');

    // Strip leading dial code if pasted with it
    if (subscriberDigits.startsWith(dialDigits) && subscriberDigits.length > dialDigits.length) {
      subscriberDigits = subscriberDigits.slice(dialDigits.length);
    }

    if (!subscriberDigits || subscriberDigits.length < 5) {
      setOrderError(`Please enter a valid customer WhatsApp number for ${country.name} (${country.dialCode}).`);
      return;
    }

    const fullInternationalPhone = `${dialDigits}${subscriberDigits}`;

    setOrderError(null);
    setCreatingOrder(true);

    try {
      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Valued Customer',
          customerPhone: fullInternationalPhone,
          items: cart,
          taxRate: 0,
          discountAmount: 0,
          paymentMethod: paymentStatus === 'PAID_CASH' ? 'CASH' : paymentStatus === 'PAID_ONLINE' ? 'ONLINE' : 'UPI',
          paymentStatus: paymentStatus === 'PENDING' ? 'PENDING' : 'PAID',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create order');
      }

      setCompletedOrder({
        orderNumber: data.order.orderNumber,
        whatsappUrl: data.whatsappUrl,
        rawReceipt: data.rawReceiptText,
        totalAmount: data.order.totalAmount,
        phone: `${country.dialCode} ${subscriberDigits}`,
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

  const handleSystemShare = async () => {
    if (!completedOrder) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${completedOrder.orderNumber}`,
          text: completedOrder.rawReceipt,
        });
      } catch {
        handleCopyReceipt();
      }
    } else {
      handleCopyReceipt();
    }
  };

  return (
    <div>
      {/* Top Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)', marginBottom: '4px' }}>
            New Order
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Select items, review your bill, and send receipts instantly via WhatsApp.
          </p>
        </div>

        {/* Live Bill Status Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="glass-panel"
            style={{
              padding: '6px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Current Bill:</span>
            <span style={{ fontWeight: 800, color: 'var(--emerald)', fontSize: '1rem' }}>
              {currency}{totalAmount.toFixed(2)}
            </span>
            <span style={{ color: 'var(--border-medium)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div
        className="pos-main-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(340px, 1.2fr)',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* ========================================================= */}
        {/* LEFT COLUMN: STEP 1 - SELECT ITEMS                        */}
        {/* ========================================================= */}
        <div>
          {/* Step 1 Header & Filters */}
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '18px', borderRadius: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                  }}
                >
                  1
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  Select Menu Items
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'} available
              </span>
            </div>

            {/* Search Input */}
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
                style={{ paddingLeft: '40px', paddingRight: searchQuery ? '36px' : '14px' }}
                placeholder="Search items by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`btn btn-sm ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ whiteSpace: 'nowrap', borderRadius: '10px' }}
              >
                All Items ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) =>
                  typeof p.categoryId === 'string' ? p.categoryId === cat._id : p.categoryId?._id === cat._id
                ).length;
                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setSelectedCategory(cat._id)}
                    className={`btn btn-sm ${selectedCategory === cat._id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ whiteSpace: 'nowrap', borderRadius: '10px' }}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Product Items Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
              Loading menu catalog...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center', borderRadius: '14px' }}>
              <ShoppingBag size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>
                No items found
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 20px' }}>
                {searchQuery
                  ? 'No products matched your search term.'
                  : 'Your catalog is empty. Head to the Products tab to add your first menu items!'}
              </p>
              <Link href="/dashboard/catalog" className="btn btn-primary btn-sm">
                <Layers size={16} /> Open Products & Menu
              </Link>
            </div>
          ) : (
            <div className="pos-grid">
              {filteredProducts.map((prod) => {
                const qtyInCart = getItemQuantityInCart(prod._id);
                const isInCart = qtyInCart > 0;
                const isOutOfStock = Boolean(prod.trackStock && (prod.stockQuantity ?? 0) <= 0);
                const remainingStock = prod.trackStock
                  ? Math.max(0, (prod.stockQuantity ?? 0) - qtyInCart)
                  : null;

                return (
                  <div
                    key={prod._id}
                    className="pos-item-card"
                    onClick={() => {
                      if (!isOutOfStock) addToCart(prod);
                    }}
                    style={{
                      borderColor: isInCart ? 'var(--whatsapp)' : undefined,
                      background: isInCart ? 'var(--bg-card-hover)' : undefined,
                      position: 'relative',
                      opacity: isOutOfStock ? 0.6 : 1,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {/* In-Cart Count Badge */}
                    {isInCart && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'var(--whatsapp)',
                          color: '#000',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          borderRadius: '12px',
                          padding: '2px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        <Check size={11} /> {qtyInCart} in bill
                      </span>
                    )}

                    {/* Stock Status Badge */}
                    {isOutOfStock ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          borderRadius: '10px',
                          padding: '2px 7px',
                        }}
                      >
                        Out of stock
                      </span>
                    ) : prod.trackStock && remainingStock !== null && !isInCart ? (
                      <span
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          background: 'rgba(37, 211, 102, 0.12)',
                          color: 'var(--whatsapp)',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          borderRadius: '10px',
                          padding: '2px 7px',
                        }}
                      >
                        {remainingStock} in stock
                      </span>
                    ) : null}

                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        {prod.sku || 'ITEM'}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, marginBottom: '6px', color: 'var(--text-main)', paddingRight: isInCart || isOutOfStock || prod.trackStock ? '70px' : '0' }}>
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
                        {currency}{prod.price.toFixed(2)}
                      </span>
                      <span
                        style={{
                          borderRadius: '8px',
                          background: isOutOfStock
                            ? 'rgba(255, 255, 255, 0.05)'
                            : isInCart
                            ? 'var(--whatsapp)'
                            : 'rgba(37, 211, 102, 0.15)',
                          color: isOutOfStock
                            ? 'var(--text-muted)'
                            : isInCart
                            ? '#000'
                            : 'var(--whatsapp)',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isOutOfStock ? (
                          'Unavailable'
                        ) : (
                          <>
                            <Plus size={14} /> Add
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: STEP 2 - ORDER BILL & CUSTOMER              */}
        {/* ========================================================= */}
        <div
          className="glass-panel pos-cart-panel"
          style={{
            padding: '22px',
            borderRadius: '16px',
            position: 'sticky',
            top: '80px',
            maxHeight: 'calc(100vh - 100px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Step 2 Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                2
              </span>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Order Bill
              </h2>
              <span className="badge badge-admin" style={{ padding: '2px 8px', fontSize: '0.72rem' }}>
                {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
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
                  padding: '4px 6px',
                }}
                title="Clear entire cart"
              >
                <Trash2 size={13} /> Clear
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
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              <AlertCircle size={16} />
              <span>{orderError}</span>
            </div>
          )}

          {/* Cart Item Rows */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '14px', maxHeight: '220px', paddingRight: '4px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-muted)' }}>
                <ShoppingBag size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.85rem' }}>Bill is empty.</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Tap items on the left to add them to this order.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.88rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'var(--text-main)',
                        }}
                      >
                        {item.productName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {currency}{item.unitPrice.toFixed(2)} each
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Qty increment / decrement controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'var(--bg-input)',
                          padding: '3px 6px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-subtle)',
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
                            padding: '2px',
                          }}
                          aria-label="Decrease quantity"
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
                            padding: '2px',
                          }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', minWidth: '52px', textAlign: 'right', color: 'var(--text-main)' }}>
                        {currency}{item.lineTotal.toFixed(2)}
                      </div>

                      {/* Remove Trash */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                        title="Remove item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Total Summary Box */}
          <div
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Items Total ({totalItemsCount}):</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span>Total Bill:</span>
              <span style={{ color: 'var(--emerald)' }}>{currency}{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Phone & Checkout Form */}
          <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} style={{ color: 'var(--whatsapp)' }} /> Customer WhatsApp Number <span style={{ color: 'var(--whatsapp)' }}>*</span>
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Country: {country.name}
                </span>
              </label>

              {/* Fixed country code prefix in the WhatsApp number field */}
              <div className="phone-fixed-input-group">
                <div
                  className="phone-fixed-prefix"
                  title={`Constant Country Code: ${country.name} (${country.dialCode})`}
                >
                  <span className="phone-fixed-prefix-code">{country.code}</span>
                  <span>{country.dialCode}</span>
                </div>
                <input
                  type="tel"
                  className="form-input phone-fixed-input"
                  style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                  placeholder="e.g. 98765 43210"
                  value={customerPhone}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    const cleanDial = country.dialCode.replace(/\D/g, '');
                    if (val.startsWith(cleanDial) && val.length > cleanDial.length) {
                      val = val.slice(cleanDial.length);
                    }
                    setCustomerPhone(val);
                  }}
                  required
                />
              </div>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Code {country.dialCode} is fixed from header selection</span>
                {customerPhone && (
                  <span style={{ color: 'var(--whatsapp)', fontWeight: 600 }}>
                    Target: {country.dialCode} {customerPhone}
                  </span>
                )}
              </div>
            </div>

            <div className="pos-checkout-row" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '8px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                  placeholder="e.g. Rahul"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>
                  Payment Method
                </label>
                <select
                  className="form-select"
                  style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="PAID_CASH">Cash</option>
                  <option value="PAID_ONLINE">Card / UPI</option>
                  <option value="PENDING">Pay Later / Pending</option>
                </select>
              </div>
            </div>

            {/* Primary Order Creation Button */}
            <button
              type="submit"
              className="btn btn-whatsapp"
              style={{ width: '100%', marginTop: '6px', padding: '12px', fontSize: '0.92rem', fontWeight: 700 }}
              disabled={creatingOrder || cart.length === 0}
            >
              <MessageSquare size={18} />
              {creatingOrder ? 'Creating Order...' : 'Create Order & Send WhatsApp Receipt'}
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POST-ORDER SHARE FLOW (MODAL)                             */}
      {/* ========================================================= */}
      {completedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', borderRadius: '18px' }}>
            {/* Success Header */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(37, 211, 102, 0.15)',
                  color: 'var(--whatsapp)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <CheckCircle2 size={30} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                Order #{completedOrder.orderNumber} Created!
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Total: <strong style={{ color: 'var(--emerald)' }}>{currency}{completedOrder.totalAmount.toFixed(2)}</strong> • Customer Phone: {completedOrder.phone}
              </p>
            </div>

            {/* Digital Receipt Card */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: '12px',
                padding: '14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: 'var(--text-main)',
                whiteSpace: 'pre-line',
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: '18px',
                lineHeight: 1.45,
              }}
            >
              {completedOrder.rawReceipt}
            </div>

            {/* Clear, Properly Aligned Share Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Option 1: Primary WhatsApp Send */}
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="btn btn-whatsapp btn-lg"
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <MessageSquare size={19} />
                <span>Send Receipt on WhatsApp</span>
                <ExternalLink size={16} />
              </button>

              {/* Option 2 & 3: Copy Receipt & System Share */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                >
                  {copied ? <Check size={16} style={{ color: 'var(--whatsapp)' }} /> : <Copy size={16} />}
                  <span>{copied ? 'Copied!' : 'Copy Receipt'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSystemShare}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                  title="Share via device apps"
                >
                  <Share2 size={16} />
                  <span>Share Receipt</span>
                </button>
              </div>

              {/* Option 4: Next Customer Order */}
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
              >
                <RotateCcw size={16} /> Take Next Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
