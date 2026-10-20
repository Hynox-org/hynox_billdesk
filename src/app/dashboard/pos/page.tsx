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
  ArrowLeft,
  Tag,
  Percent,
  Banknote,
  QrCode,
  Clock,
  FileText,
  Download,
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

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote },
  { id: 'CARD', label: 'Card', icon: CreditCard },
  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
  { id: 'PENDING', label: 'Pay Later', icon: Clock },
] as const;

type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

export default function OrderCreationPage() {
  const { country } = useCountry();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('$');
  const [activeStep, setActiveStep] = useState<1 | 2>(1);

  // Cart & Customer State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>('CASH');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Discount State (Toggle between percentage % and flat value)
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountValue, setDiscountValue] = useState<string>('');

  // Post-Order Sharing Modal
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    whatsappUrl: string;
    rawReceipt: string;
    totalAmount: number;
    phone: string;
    pdfUrl?: string;
    receiptUrl?: string;
    gstNumber?: string | null;
    googleProfileUrl?: string | null;
  } | null>(null);

  const [sharingPdf, setSharingPdf] = useState(false);

  const [tenantInfo, setTenantInfo] = useState<{
    businessName?: string;
    gstNumber?: string;
    showGstOnReceipt?: boolean;
    googleProfileUrl?: string;
    showGoogleReviewOnReceipt?: boolean;
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
          if (authData.tenant) {
            setTenantInfo({
              businessName: authData.tenant.businessName,
              gstNumber: authData.tenant.gstNumber,
              showGstOnReceipt: Boolean(authData.tenant.showGstOnReceipt),
              googleProfileUrl: authData.tenant.googleProfileUrl,
              showGoogleReviewOnReceipt: Boolean(authData.tenant.showGoogleReviewOnReceipt),
            });
          }
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
    setDiscountValue('');
    setDiscountType('PERCENT');
    setPaymentMethod('CASH');
    setOrderError(null);
    setActiveStep(1);
  };

  // Get item count in cart
  const getItemQuantityInCart = (productId: string) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.lineTotal, 0);
  const parsedDiscountNum = Math.max(0, parseFloat(discountValue) || 0);
  let discountAmount = 0;
  let parsedPercent = 0;
  if (discountType === 'PERCENT') {
    parsedPercent = Math.min(100, parsedDiscountNum);
    discountAmount = Number(((subtotal * parsedPercent) / 100).toFixed(2));
  } else {
    discountAmount = Number(Math.min(subtotal, parsedDiscountNum).toFixed(2));
    parsedPercent = subtotal > 0 ? Number(((discountAmount / subtotal) * 100).toFixed(1)) : 0;
  }
  const totalAmount = Number(Math.max(0, subtotal - discountAmount).toFixed(2));
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

    const paymentStatus =
      paymentMethod === 'CASH'
        ? 'PAID_CASH'
        : paymentMethod === 'PENDING'
        ? 'PENDING'
        : 'PAID_ONLINE';

    try {
      const res = await fetch('/api/pos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim() || 'Valued Customer',
          customerPhone: fullInternationalPhone,
          items: cart,
          taxRate: 0,
          discount: discountAmount,
          discountAmount: discountAmount,
          discountPercent: parsedPercent,
          discountType,
          paymentMethod: paymentMethod,
          paymentStatus: paymentStatus,
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
        pdfUrl: data.pdfUrl || `/api/receipts/${data.order.orderNumber}/pdf`,
        receiptUrl: data.receiptUrl || `/receipt/${data.order.orderNumber}`,
        gstNumber: data.gstNumber,
        googleProfileUrl: data.googleProfileUrl,
      });

      // Clear the active cart
      clearCart();
    } catch (err: any) {
      setOrderError(err.message || 'Error creating order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleSharePdf = async () => {
    if (!completedOrder) return;
    setSharingPdf(true);
    try {
      const pdfEndpoint = completedOrder.pdfUrl || `/api/receipts/${completedOrder.orderNumber}/pdf`;
      const res = await fetch(pdfEndpoint);
      if (!res.ok) throw new Error('Failed to load PDF');
      const blob = await res.blob();
      const file = new File([blob], `Receipt-${completedOrder.orderNumber}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt #${completedOrder.orderNumber}`,
          text: `Invoice #${completedOrder.orderNumber} from ${tenantInfo?.businessName || 'our shop'}.`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt-${completedOrder.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing PDF:', err);
      }
    } finally {
      setSharingPdf(false);
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
      <div className="pos-header-banner">
        <div>
          <h1 className="pos-header-title">
            New Order
          </h1>
        </div>

        {/* Live Bill Status Pill & Quick Jump */}
        <div className="pos-header-bill-status">
          <button
            type="button"
            onClick={() => {
              setActiveStep((prev) => (prev === 1 ? 2 : 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="glass-panel pos-bill-pill-btn"
            title={activeStep === 1 ? 'Switch to order bill' : 'Back to menu catalog'}
          >
            <span className="pos-bill-pill-label">Bill:</span>
            <span className="pos-bill-pill-amount">
              {currency}{totalAmount.toFixed(2)}
            </span>
            <span className="pos-bill-pill-divider">|</span>
            <span className="pos-bill-pill-count">
              {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
            </span>
            <span className="pos-bill-pill-toggle">
              {activeStep === 1 ? 'Review \u2192' : '\u2190 Menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Sequential Step Tabs (Visible only on mobile & tablet <= 1080px) */}
      <div className="pos-mobile-step-tabs" role="tablist" aria-label="Order Creation Steps">
        <button
          type="button"
          role="tab"
          aria-selected={activeStep === 1}
          className={`pos-step-tab ${activeStep === 1 ? 'active' : ''}`}
          onClick={() => {
            setActiveStep(1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="pos-step-num">1</span>
          <span className="pos-step-title">Select Items</span>
          {totalItemsCount > 0 && (
            <span className="pos-step-badge">{totalItemsCount}</span>
          )}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeStep === 2}
          className={`pos-step-tab ${activeStep === 2 ? 'active' : ''}`}
          onClick={() => {
            setActiveStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="pos-step-num">2</span>
          <span className="pos-step-title">Review &amp; Bill</span>
          <span className="pos-step-price">
            {currency}{totalAmount.toFixed(2)}
          </span>
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="pos-main-grid">
        {/* ========================================================= */}
        {/* LEFT COLUMN: STEP 1 - SELECT ITEMS                        */}
        {/* ========================================================= */}
        <div className={`pos-step-1-col ${activeStep !== 1 ? 'pos-step-hidden-mobile' : ''}`}>
          {/* Step 1 Header & Filters */}
          <div className="glass-panel pos-filter-card">
            <div className="pos-filter-header">
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
                placeholder="Search items or SKU..."
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
            <div className="pos-category-pills">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`btn btn-sm pos-cat-btn ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
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
                    className={`btn btn-sm pos-cat-btn ${selectedCategory === cat._id ? 'btn-primary' : 'btn-secondary'}`}
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
                const isMaxStockReached = Boolean(
                  prod.trackStock &&
                  (prod.stockQuantity ?? 0) > 0 &&
                  qtyInCart >= (prod.stockQuantity ?? 0)
                );

                return (
                  <div
                    key={prod._id}
                    className={`pos-item-card ${isInCart ? 'is-in-cart' : ''} ${isOutOfStock ? 'is-out-of-stock' : ''}`}
                    onClick={() => {
                      if (!isOutOfStock && !isInCart) addToCart(prod);
                    }}
                  >
                    {/* Top status line: SKU on left, badge on right */}
                    <div className="pos-card-header">
                      <span className="pos-card-sku">{prod.sku || 'ITEM'}</span>
                      {isInCart ? (
                        <span className="pos-badge-incart">
                          <Check size={11} /> {qtyInCart} in bill
                        </span>
                      ) : isOutOfStock ? (
                        <span className="pos-badge-out">Out of stock</span>
                      ) : prod.trackStock && remainingStock !== null ? (
                        <span className="pos-badge-stock">{remainingStock} left</span>
                      ) : null}
                    </div>

                    <div className="pos-card-body">
                      <div className="pos-card-title">{prod.name}</div>
                      {prod.description && (
                        <div className="pos-card-desc">{prod.description}</div>
                      )}
                    </div>

                    <div className="pos-card-footer">
                      <span className="pos-card-price">
                        {currency}{prod.price.toFixed(2)}
                      </span>
                      {isOutOfStock ? (
                        <span className="pos-card-add-btn disabled">Unavailable</span>
                      ) : isInCart ? (
                        <div
                          className="pos-card-qty-control"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="pos-card-qty-btn pos-card-qty-minus"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(prod._id, -1);
                            }}
                            title="Decrease quantity or remove"
                            aria-label={`Decrease ${prod.name} quantity`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="pos-card-qty-count">{qtyInCart}</span>
                          <button
                            type="button"
                            className="pos-card-qty-btn pos-card-qty-plus"
                            disabled={isMaxStockReached}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod);
                            }}
                            title={isMaxStockReached ? 'Stock limit reached' : 'Increase quantity'}
                            aria-label={`Increase ${prod.name} quantity`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="pos-card-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod);
                          }}
                          aria-label={`Add ${prod.name} to bill`}
                        >
                          <Plus size={14} /> Add
                        </button>
                      )}
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
          id="pos-cart-panel"
          className={`glass-panel pos-cart-panel pos-step-2-col ${
            activeStep !== 2 ? 'pos-step-hidden-mobile' : ''
          }`}
        >
          {/* Mobile Back-to-Step-1 Navigation Bar */}
          <div className="pos-mobile-back-row">
            <button
              type="button"
              className="pos-mobile-back-btn"
              onClick={() => {
                setActiveStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <ArrowLeft size={14} /> Add Items
            </button>
          </div>

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
                background: 'var(--moss-badge-bg)',
                border: '1px solid var(--moss-badge-border)',
                color: 'var(--text-main)',
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
          <div className="pos-cart-items-scroll">
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
                    className="pos-cart-item-row"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="pos-cart-item-name">
                        {item.productName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {currency}{item.unitPrice.toFixed(2)} each
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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

          {/* Simple Numeric Percentage Discount Field */}
          <div style={{ marginBottom: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Percent size={13} style={{ color: 'var(--whatsapp)' }} />
                <span>Discount</span>
              </span>
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '6px',
                  padding: '2px',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('PERCENT');
                    setDiscountValue('');
                  }}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: discountType === 'PERCENT' ? 700 : 500,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: discountType === 'PERCENT' ? 'var(--emerald)' : 'transparent',
                    color: discountType === 'PERCENT' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  %
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDiscountType('FLAT');
                    setDiscountValue('');
                  }}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.75rem',
                    fontWeight: discountType === 'FLAT' ? 700 : 500,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: discountType === 'FLAT' ? 'var(--emerald)' : 'transparent',
                    color: discountType === 'FLAT' ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {currency} Flat
                </button>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              {discountType === 'FLAT' && (
                <span
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  {currency}
                </span>
              )}
              <input
                type="number"
                min="0"
                max={discountType === 'PERCENT' ? '100' : undefined}
                step="any"
                placeholder={discountType === 'PERCENT' ? '0' : '0.00'}
                value={discountValue}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDiscountValue('');
                    return;
                  }
                  const num = Number(val);
                  if (!isNaN(num) && num >= 0) {
                    if (discountType === 'PERCENT' && num > 100) return;
                    setDiscountValue(val);
                  }
                }}
                className="form-input"
                style={{
                  fontSize: '0.88rem',
                  padding: discountType === 'FLAT' ? '8px 12px 8px 28px' : '8px 32px 8px 12px',
                  width: '100%',
                }}
              />
              {discountType === 'PERCENT' && (
                <span
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                >
                  %
                </span>
              )}
            </div>

            {discountAmount > 0 && (
              <div style={{ marginTop: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--emerald)', textAlign: 'right' }}>
                Saved: {currency}{discountAmount.toFixed(2)}
                {discountType === 'FLAT' && subtotal > 0 && ` (${parsedPercent}%)`}
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
              <span>Subtotal ({totalItemsCount}):</span>
              <span>{currency}{subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  fontSize: '0.85rem',
                  color: 'var(--emerald)',
                  fontWeight: 600,
                }}
              >
                <span>Discount ({discountType === 'PERCENT' ? `${parsedPercent}%` : `${currency}${discountAmount.toFixed(2)}`}):</span>
                <span>-{currency}{discountAmount.toFixed(2)}</span>
              </div>
            )}

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
              <span>Total:</span>
              <span style={{ color: 'var(--emerald)' }}>{currency}{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Customer Phone & Checkout Form */}
          <form onSubmit={handleCreateOrder} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={13} style={{ color: 'var(--whatsapp)' }} /> WhatsApp Number <span style={{ color: 'var(--whatsapp)' }}>*</span>
                </span>
              </label>

              {/* Fixed country code prefix in the WhatsApp number field */}
              <div className="phone-fixed-input-group">
                <div
                  className="phone-fixed-prefix"
                  title={`${country.name} (${country.dialCode})`}
                >
                  <span className="phone-fixed-prefix-code">{country.code}</span>
                  <span>{country.dialCode}</span>
                </div>
                <input
                  type="tel"
                  className="form-input phone-fixed-input"
                  style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                  placeholder="Phone number"
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

              {customerPhone && (
                <div style={{ fontSize: '0.72rem', color: 'var(--whatsapp)', marginTop: '4px', fontWeight: 600 }}>
                  Recipient: {country.dialCode} {customerPhone}
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <User size={13} style={{ color: 'var(--text-muted)' }} /> Customer Name (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                placeholder="Customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>

            {/* Payment Method Option Tiles with Icons */}
            <div>
              <label className="form-label" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                <CreditCard size={13} style={{ color: 'var(--whatsapp)' }} /> Payment Method
              </label>
              <div className="pos-pay-method-grid">
                {PAYMENT_METHODS.map((pm) => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`pos-pay-method-card ${isSelected ? 'is-selected' : ''}`}
                      aria-pressed={isSelected}
                    >
                      <div className="pos-pay-method-icon-wrap">
                        <Icon size={17} />
                      </div>
                      <span className="pos-pay-method-title">{pm.label}</span>
                      {isSelected && (
                        <span className="pos-pay-method-check">
                          <Check size={9} />
                        </span>
                      )}
                    </button>
                  );
                })}
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

      {/* Mobile Floating Cart Summary Pill (shown only on mobile/tablet during Step 1 when cart has items) */}
      {cart.length > 0 && activeStep === 1 && (
        <button
          type="button"
          onClick={() => {
            setActiveStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="pos-mobile-cart-float"
          aria-label="Proceed to review bill and checkout"
        >
          <div className="pos-mobile-cart-float-info">
            <span className="pos-mobile-cart-float-badge">
              <ShoppingBag size={14} /> {totalItemsCount}
            </span>
            <span className="pos-mobile-cart-float-total">
              {currency}{totalAmount.toFixed(2)}
            </span>
          </div>
          <span className="pos-mobile-cart-float-btn">
            Review Bill &amp; Pay &rarr;
          </span>
        </button>
      )}

      {/* ========================================================= */}
      {/* POST-ORDER SHARE FLOW (MODAL)                             */}
      {/* ========================================================= */}
      {completedOrder && (
        <div className="modal-overlay">
          <div className="modal-content pos-receipt-modal">
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

            {/* Visual Receipt Inclusions Badges */}
            {(completedOrder.gstNumber || completedOrder.googleProfileUrl) && (
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '10px',
                  justifyContent: 'center',
                }}
              >
                {completedOrder.gstNumber && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.74rem',
                      background: 'rgba(37, 211, 102, 0.1)',
                      color: 'var(--whatsapp)',
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      fontWeight: 600,
                    }}
                  >
                    GST: {completedOrder.gstNumber}
                  </span>
                )}
                {completedOrder.googleProfileUrl && (
                  <a
                    href={completedOrder.googleProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: '0.74rem',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#2563eb',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      textDecoration: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Google Review Link Attached
                  </a>
                )}
              </div>
            )}

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

              {/* Option 2 & 3: PDF Actions (Native Share & Download) */}
              <div className="pos-receipt-actions-row">
                <button
                  type="button"
                  onClick={handleSharePdf}
                  disabled={sharingPdf}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center' }}
                  title="Share actual PDF file to WhatsApp or device apps"
                >
                  <FileText size={16} style={{ color: 'var(--whatsapp)' }} />
                  <span>{sharingPdf ? 'Sharing PDF...' : 'Share PDF File'}</span>
                </button>

                <a
                  href={completedOrder.pdfUrl || `/api/receipts/${completedOrder.orderNumber}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ justifyContent: 'center', textDecoration: 'none' }}
                  title="Download PDF invoice directly"
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </a>
              </div>

              {/* Option 4 & 5: Copy Receipt & System Share */}
              <div className="pos-receipt-actions-row">
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
                  <span>Share Text</span>
                </button>
              </div>

              {/* Option 4: Next Customer Order */}
              <button
                type="button"
                onClick={() => {
                  setCompletedOrder(null);
                  setActiveStep(1);
                }}
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
