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
  ExternalLink,
  MessageSquare,
  AlertCircle,
  ShoppingBag,
  ShoppingCart,
  RotateCcw,
  Layers,
  CreditCard,
  X,
  Check,
  ArrowLeft,
  Percent,
  Banknote,
  QrCode,
  Clock,
  Share2,
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

  // Tax / GST State (Loaded from settings, modifiable in checkout)
  const [isTaxEnabled, setIsTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState<number | string>(18);
  const [taxName, setTaxName] = useState('GST');
  const [taxType, setTaxType] = useState<'EXCLUDED' | 'INCLUDED'>('EXCLUDED');

  // Post-Order Sharing Modal
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    businessName: string;
    businessType?: string;
    items: Array<{
      productName: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    taxRate?: number;
    taxName?: string;
    taxType?: 'EXCLUDED' | 'INCLUDED';
    isTaxIncluded?: boolean;
    totalAmount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: string;
    whatsappUrl: string;
    rawReceipt: string;
    phone: string;
    pdfUrl?: string;
    receiptUrl?: string;
    gstNumber?: string | null;
    googleProfileUrl?: string | null;
  } | null>(null);

  const [tenantInfo, setTenantInfo] = useState<{
    businessName?: string;
    businessType?: string;
    gstNumber?: string;
    showGstOnReceipt?: boolean;
    googleProfileUrl?: string;
    showGoogleReviewOnReceipt?: boolean;
    defaultTaxName?: string;
    defaultTaxRate?: number;
    enableTaxOnCheckout?: boolean;
    defaultTaxType?: 'EXCLUDED' | 'INCLUDED';
  } | null>(null);

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
            const tRate = authData.tenant.defaultTaxRate !== undefined ? authData.tenant.defaultTaxRate : 18;
            const tName = authData.tenant.defaultTaxName || 'GST';
            const checkoutTaxEnabled = Boolean(authData.tenant.enableTaxOnCheckout);
            const defTaxType = authData.tenant.defaultTaxType || 'EXCLUDED';
            setTenantInfo({
              businessName: authData.tenant.businessName,
              businessType: authData.tenant.businessType,
              gstNumber: authData.tenant.gstNumber,
              showGstOnReceipt: Boolean(authData.tenant.showGstOnReceipt),
              googleProfileUrl: authData.tenant.googleProfileUrl,
              showGoogleReviewOnReceipt: Boolean(authData.tenant.showGoogleReviewOnReceipt),
              defaultTaxName: tName,
              defaultTaxRate: tRate,
              enableTaxOnCheckout: checkoutTaxEnabled,
              defaultTaxType: defTaxType,
            });
            setTaxRate(tRate);
            setTaxName(tName);
            setIsTaxEnabled(checkoutTaxEnabled);
            setTaxType(defTaxType);
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
    if (tenantInfo?.defaultTaxRate !== undefined) {
      setTaxRate(tenantInfo.defaultTaxRate);
      setIsTaxEnabled(Boolean(tenantInfo.enableTaxOnCheckout));
      setTaxType(tenantInfo.defaultTaxType || 'EXCLUDED');
    }
    setPaymentMethod('CASH');
    setOrderError(null);
    setActiveStep(1);
  };

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
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);
  const activeTaxRate = isTaxEnabled ? Math.max(0, parseFloat(String(taxRate)) || 0) : 0;
  const isTaxIncluded = taxType === 'INCLUDED';
  const taxAmount = isTaxEnabled && activeTaxRate > 0
    ? Number(((taxableSubtotal * activeTaxRate) / 100).toFixed(2))
    : 0;
  const totalAmount = isTaxIncluded
    ? Number(taxableSubtotal.toFixed(2))
    : Number((taxableSubtotal + taxAmount).toFixed(2));
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
          subtotal: subtotal,
          tax: taxAmount,
          taxRate: activeTaxRate,
          taxName: taxName,
          taxType: taxType,
          isTaxIncluded: isTaxIncluded,
          discount: discountAmount,
          discountAmount: discountAmount,
          discountPercent: parsedPercent,
          discountType,
          totalAmount: totalAmount,
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
        businessName: tenantInfo?.businessName || 'Store Receipt',
        businessType: tenantInfo?.businessType,
        items: data.order.items && data.order.items.length > 0 ? data.order.items : cart,
        subtotal: typeof data.order.subtotal === 'number' ? data.order.subtotal : subtotal,
        discount: typeof data.order.discount === 'number' ? data.order.discount : discountAmount,
        tax: typeof data.order.tax === 'number' ? data.order.tax : taxAmount,
        taxRate: typeof data.order.taxRate === 'number' ? data.order.taxRate : activeTaxRate,
        taxName: data.order.taxName || data.order.tax1Name || taxName,
        taxType: data.order.taxType || taxType,
        isTaxIncluded: data.order.isTaxIncluded !== undefined ? data.order.isTaxIncluded : isTaxIncluded,
        totalAmount: typeof data.order.totalAmount === 'number' ? data.order.totalAmount : totalAmount,
        currency: currency,
        paymentMethod: data.order.paymentMethod || paymentMethod,
        paymentStatus: data.order.paymentStatus || paymentStatus,
        whatsappUrl: data.whatsappUrl,
        rawReceipt: data.rawReceiptText,
        phone: `${country.dialCode} ${subscriberDigits}`,
        pdfUrl: data.pdfUrl || `/api/receipts/${data.order.orderNumber}/pdf`,
        gstNumber: data.order.gstNumber || data.gstNumber || (tenantInfo?.showGstOnReceipt ? tenantInfo?.gstNumber : null) || null,
        googleProfileUrl: data.googleProfileUrl || (tenantInfo?.showGoogleReviewOnReceipt ? tenantInfo?.googleProfileUrl : null) || null,
      });

      // Clear active cart after successful creation
      clearCart();
    } catch (err: any) {
      setOrderError(err.message || 'Error creating order');
    } finally {
      setCreatingOrder(false);
    }
  };

  const getPaymentBadgeLabel = (method?: string) => {
    switch (method) {
      case 'CASH':
        return 'Paid - Cash';
      case 'CARD':
        return 'Paid - Card';
      case 'UPI':
        return 'Paid - UPI';
      case 'PENDING':
        return 'Pay Later';
      default:
        return method ? `Paid - ${method}` : 'Paid';
    }
  };

  const handleOpenWhatsApp = () => {
    if (completedOrder) {
      window.open(completedOrder.whatsappUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Lock body scroll when full-screen receipt popup is open
  useEffect(() => {
    if (completedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [completedOrder]);

  return (
    <div className="pos-page-wrapper">
      {/* ========================================================= */}
      {/* TOP HEADER (Responsive & Clean)                           */}
      {/* ========================================================= */}
      <div className="pos-unified-header">
        <div className="pos-header-title-box">
          <h1 className="pos-header-title">New Order</h1>
          <p className="pos-header-subtitle">
            Instant billing with digital WhatsApp receipts
          </p>
        </div>

        {/* Desktop Live Order Pill Indicator */}
        <div className="pos-desktop-bill-badge">
          <ShoppingBag size={16} />
          <span>
            {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
          </span>
          <span className="pos-badge-sep">•</span>
          <strong className="pos-badge-amt">
            {currency}{totalAmount.toFixed(2)}
          </strong>
        </div>

        {/* Mobile Header Quick Cart Trigger (When on Catalog view) */}
        {activeStep === 1 && totalItemsCount > 0 && (
          <button
            type="button"
            className="pos-mobile-header-cart-btn"
            onClick={() => {
              setActiveStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            aria-label="View current cart"
          >
            <ShoppingCart size={18} />
            <span className="pos-mobile-cart-count">{totalItemsCount}</span>
          </button>
        )}
      </div>

      {/* ========================================================= */}
      {/* MAIN LAYOUT (2-Column Desktop, Dedicated Views on Mobile) */}
      {/* ========================================================= */}
      <div className="pos-main-layout">
        {/* ======================================================= */}
        {/* CATALOG PANEL (Visible on Desktop OR Mobile Step 1)     */}
        {/* ======================================================= */}
        <div className={`pos-catalog-panel ${activeStep !== 1 ? 'pos-hide-on-mobile' : ''}`}>
          {/* Search Bar */}
          <div className="pos-search-wrapper">
            <Search size={18} className="pos-search-icon" />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Search products or scan barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="pos-search-clear"
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Category Chips Bar */}
          <div className="pos-category-bar">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`pos-category-chip ${selectedCategory === 'ALL' ? 'active' : ''}`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                type="button"
                onClick={() => setSelectedCategory(cat._id)}
                className={`pos-category-chip ${selectedCategory === cat._id ? 'active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="pos-catalog-empty-card">
              <p>Loading products catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="pos-catalog-empty-card">
              <ShoppingBag size={44} className="pos-empty-icon" />
              <h3>No products found</h3>
              <p>
                {searchQuery
                  ? 'No items matched your search query.'
                  : 'Your catalog is empty. Head to Products to add items.'}
              </p>
              <Link href="/dashboard/catalog" className="btn btn-primary btn-sm">
                <Layers size={16} /> Manage Products
              </Link>
            </div>
          ) : (
            <div className="pos-product-grid">
              {filteredProducts.map((prod) => {
                const qtyInCart = getItemQuantityInCart(prod._id);
                const isInCart = qtyInCart > 0;
                const isOutOfStock = Boolean(prod.trackStock && (prod.stockQuantity ?? 0) <= 0);
                const remainingStock = prod.trackStock
                  ? Math.max(0, (prod.stockQuantity ?? 0) - qtyInCart)
                  : null;

                const categoryName =
                  typeof prod.categoryId === 'object' && prod.categoryId?.name
                    ? prod.categoryId.name
                    : categories.find((c) => c._id === prod.categoryId)?.name || 'General';

                const initialLetter = (prod.name || 'P').trim().charAt(0).toUpperCase();

                return (
                  <div
                    key={prod._id}
                    className={`pos-product-card ${isInCart ? 'is-in-cart' : ''} ${isOutOfStock ? 'is-out-of-stock' : ''}`}
                    onClick={() => {
                      if (!isOutOfStock) addToCart(prod);
                    }}
                    title={isOutOfStock ? `${prod.name} (Out of stock)` : `Add ${prod.name}`}
                  >
                    {/* Top Row: Squircle Avatar & In-Card Quantity Stepper */}
                    <div className="pos-card-top-row">
                      <div className={`pos-card-avatar ${isInCart ? 'is-in-cart' : ''}`}>
                        {initialLetter}
                      </div>

                      {isInCart ? (
                        <div
                          className="pos-card-stepper"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="pos-stepper-btn pos-stepper-minus"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(prod._id, -1);
                            }}
                            title="Decrease quantity"
                            aria-label={`Decrease ${prod.name} quantity`}
                          >
                            <Minus size={13} />
                          </button>
                          <span className="pos-stepper-count">{qtyInCart}</span>
                          <button
                            type="button"
                            className="pos-stepper-btn pos-stepper-plus"
                            disabled={Boolean(
                              prod.trackStock &&
                              (prod.stockQuantity ?? 0) > 0 &&
                              qtyInCart >= (prod.stockQuantity ?? 0)
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(prod);
                            }}
                            title="Increase quantity"
                            aria-label={`Increase ${prod.name} quantity`}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      ) : !isOutOfStock ? (
                        <button
                          type="button"
                          className="pos-card-quick-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(prod);
                          }}
                          title={`Add ${prod.name}`}
                          aria-label={`Add ${prod.name}`}
                        >
                          <Plus size={15} />
                        </button>
                      ) : null}
                    </div>

                    {/* Middle Row: Name & Category */}
                    <div className="pos-card-body">
                      <div className="pos-card-title" title={prod.name}>
                        {prod.name}
                      </div>
                      <div className="pos-card-category" title={categoryName}>
                        {categoryName}
                      </div>
                    </div>

                    {/* Bottom Row: Price & Stock Badge */}
                    <div className="pos-card-footer">
                      <span className="pos-card-price">
                        {currency}{prod.price.toFixed(2)}
                      </span>
                      {isOutOfStock ? (
                        <span className="pos-stock-pill is-out">Out of stock</span>
                      ) : prod.trackStock && remainingStock !== null ? (
                        <span className={`pos-stock-pill ${remainingStock <= 10 ? 'is-low' : 'is-normal'}`}>
                          {remainingStock} in stock
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================= */}
        {/* CHECKOUT PANEL (Visible on Desktop OR Mobile Step 2)    */}
        {/* ======================================================= */}
        <div className={`pos-checkout-panel ${activeStep !== 2 ? 'pos-hide-on-mobile' : ''}`}>
          <div className="pos-order-card glass-panel">
            {/* Mobile Back-to-Menu Navigation Bar (Only on mobile when reviewing bill) */}
            <div className="pos-mobile-checkout-nav">
              <button
                type="button"
                className="pos-back-to-menu-btn"
                onClick={() => {
                  setActiveStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to Menu</span>
              </button>
              <span className="pos-mobile-checkout-title">
                Order Review ({totalItemsCount})
              </span>
              {cart.length > 0 && (
                <button
                  type="button"
                  className="pos-clear-cart-link"
                  onClick={clearCart}
                  title="Clear entire order"
                >
                  <Trash2 size={14} /> Clear
                </button>
              )}
            </div>

            {/* Desktop Header */}
            <div className="pos-desktop-order-header">
              <div className="pos-order-header-left">
                <ShoppingCart size={20} className="pos-header-cart-icon" />
                <h2 className="pos-order-header-title">Current Order</h2>
                <span className="pos-order-pill">
                  {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'}
                </span>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  className="pos-clear-cart-link"
                  onClick={clearCart}
                  title="Clear entire order"
                >
                  <Trash2 size={13} /> Clear
                </button>
              )}
            </div>

            {orderError && (
              <div className="pos-order-alert">
                <AlertCircle size={16} />
                <span>{orderError}</span>
              </div>
            )}

            {/* Cart Items List */}
            <div className="pos-cart-items-scroll">
              {cart.length === 0 ? (
                <div className="pos-empty-cart-state">
                  <ShoppingCart size={32} className="pos-empty-cart-icon" />
                  <p className="pos-empty-cart-title">Your order is empty</p>
                  <p className="pos-empty-cart-desc">
                    Tap products from the catalog to build this order.
                  </p>
                </div>
              ) : (
                <div className="pos-cart-items-list">
                  {cart.map((item) => (
                    <div key={item.productId} className="pos-cart-item-row">
                      <div className="pos-cart-item-meta">
                        <div className="pos-cart-item-name">{item.productName}</div>
                        <div className="pos-cart-item-unit-price">
                          {currency}{item.unitPrice.toFixed(2)}
                        </div>
                      </div>

                      <div className="pos-cart-item-controls">
                        <div className="pos-cart-stepper">
                          <button
                            type="button"
                            className="pos-cart-stepper-btn"
                            onClick={() => updateQuantity(item.productId, -1)}
                            title="Decrease quantity"
                            aria-label={`Decrease ${item.productName} quantity`}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="pos-cart-stepper-count">{item.quantity}</span>
                          <button
                            type="button"
                            className="pos-cart-stepper-btn"
                            onClick={() => updateQuantity(item.productId, 1)}
                            title="Increase quantity"
                            aria-label={`Increase ${item.productName} quantity`}
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <div className="pos-cart-item-total">
                          {currency}{item.lineTotal.toFixed(2)}
                        </div>

                        <button
                          type="button"
                          className="pos-cart-item-delete-btn"
                          onClick={() => removeFromCart(item.productId)}
                          title="Remove item"
                          aria-label={`Remove ${item.productName}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Add More Items Button */}
            {cart.length > 0 && (
              <button
                type="button"
                className="pos-mobile-add-more-btn"
                onClick={() => {
                  setActiveStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Plus size={15} /> Add More Items from Menu
              </button>
            )}

            {/* Discount Section (% vs Flat) */}
            <div className="pos-discount-section">
              <div className="pos-discount-header">
                <span className="pos-discount-title">
                  <Percent size={13} />
                  <span>Discount</span>
                </span>
                <div className="pos-discount-toggle">
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('PERCENT');
                      setDiscountValue('');
                    }}
                    className={`pos-discount-toggle-btn ${discountType === 'PERCENT' ? 'active' : ''}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('FLAT');
                      setDiscountValue('');
                    }}
                    className={`pos-discount-toggle-btn ${discountType === 'FLAT' ? 'active' : ''}`}
                  >
                    {currency} Flat
                  </button>
                </div>
              </div>

              <div className="pos-discount-input-wrapper">
                {discountType === 'FLAT' && (
                  <span className="pos-discount-input-symbol pos-symbol-left">{currency}</span>
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
                  className={`form-input pos-discount-input ${discountType === 'FLAT' ? 'has-left' : 'has-right'}`}
                />
                {discountType === 'PERCENT' && (
                  <span className="pos-discount-input-symbol pos-symbol-right">%</span>
                )}
              </div>

              {discountAmount > 0 && (
                <div className="pos-discount-saved-pill">
                  Saved {currency}{discountAmount.toFixed(2)}
                  {discountType === 'FLAT' && subtotal > 0 && ` (${parsedPercent}%)`}
                </div>
              )}
            </div>

            {/* Tax / GST Section (Modifiable in Checkout Card) */}
            <div className="pos-discount-section" style={{ marginTop: '10px' }}>
              <div className="pos-discount-header">
                <span className="pos-discount-title">
                  <Percent size={13} />
                  <span>Tax / GST</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsTaxEnabled(!isTaxEnabled)}
                    className={`pos-discount-toggle-btn ${isTaxEnabled ? 'active' : ''}`}
                    title={isTaxEnabled ? 'Tax is applied' : 'Tax is exempted'}
                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  >
                    {isTaxEnabled ? 'Applied' : 'Exempt'}
                  </button>
                </div>
              </div>

              {isTaxEnabled && (
                <>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                    <div className="pos-discount-input-wrapper" style={{ flex: 1 }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        placeholder="Tax %"
                        value={taxRate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setTaxRate('');
                            return;
                          }
                          const num = Number(val);
                          if (!isNaN(num) && num >= 0 && num <= 100) {
                            setTaxRate(val);
                          }
                        }}
                        className="form-input pos-discount-input has-right"
                      />
                      <span className="pos-discount-input-symbol pos-symbol-right">%</span>
                    </div>

                    {/* Quick Preset Pills for Fast 1-Tap Switching */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {[0, 5, 12, 18, 28].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setTaxRate(rate)}
                          className={`btn btn-secondary btn-sm`}
                          style={{
                            padding: '4px 7px',
                            fontSize: '0.72rem',
                            height: '34px',
                            minWidth: '34px',
                            fontWeight: Number(taxRate) === rate ? 700 : 500,
                            borderColor: Number(taxRate) === rate ? 'var(--whatsapp)' : 'var(--border-subtle)',
                            color: Number(taxRate) === rate ? 'var(--whatsapp)' : 'var(--text-secondary)',
                            background: Number(taxRate) === rate ? 'var(--color-light-green)' : 'transparent',
                          }}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tax Included / Excluded Calculation Toggle */}
                  <div className="pos-tax-calc-mode-container">
                    <div className="pos-tax-calc-mode-header">
                      <span className="pos-tax-calc-mode-label">Tax Calculation:</span>
                      <span className="pos-tax-calc-mode-hint">
                        {taxType === 'EXCLUDED'
                          ? 'Subtotal + Tax = Total'
                          : 'Subtotal = Total (Tax included)'}
                      </span>
                    </div>
                    <div className="pos-tax-calc-mode-switch">
                      <button
                        type="button"
                        onClick={() => setTaxType('EXCLUDED')}
                        className={`pos-tax-calc-btn ${taxType === 'EXCLUDED' ? 'active' : ''}`}
                        title="Excluded Tax: Tax is added on top of subtotal (Subtotal + Tax = Total)"
                      >
                        Excluded Tax
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxType('INCLUDED')}
                        className={`pos-tax-calc-btn ${taxType === 'INCLUDED' ? 'active' : ''}`}
                        title="Included Tax: Tax is included in item prices (Subtotal = Total)"
                      >
                        Included Tax
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Pricing Total Summary Box */}
            <div className="pos-summary-card">
              <div className="pos-summary-row">
                <span>Subtotal ({totalItemsCount}):</span>
                <span>{currency}{subtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="pos-summary-row is-discount">
                  <span>
                    Discount ({discountType === 'PERCENT' ? `${parsedPercent}%` : `${currency}${discountAmount.toFixed(2)}`}):
                  </span>
                  <span>-{currency}{discountAmount.toFixed(2)}</span>
                </div>
              )}

              {activeTaxRate > 0 && (
                <div className="pos-summary-row" style={{ color: 'var(--text-secondary)' }}>
                  <span>
                    {taxName || 'Tax'} ({activeTaxRate}%{isTaxIncluded ? ' included' : ''}):
                  </span>
                  <span>
                    {isTaxIncluded ? '' : '+'}
                    {currency}{taxAmount.toFixed(2)}
                    {isTaxIncluded ? ' (Incl.)' : ''}
                  </span>
                </div>
              )}

              <div className="pos-summary-row is-total">
                <span>Total:</span>
                <span className="pos-summary-total-amt">{currency}{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Details & Payment Form */}
            <form onSubmit={handleCreateOrder} className="pos-checkout-form">
              {/* WhatsApp Number Field */}
              <div className="pos-form-group">
                <label className="form-label pos-field-label">
                  <span className="pos-label-left">
                    <Phone size={13} className="pos-icon-whatsapp" /> WhatsApp Number <span className="pos-req-star">*</span>
                  </span>
                </label>
                <div className="phone-fixed-input-group">
                  <div className="phone-fixed-prefix" title={`${country.name} (${country.dialCode})`}>
                    <span className="phone-fixed-prefix-code">{country.code}</span>
                    <span>{country.dialCode}</span>
                  </div>
                  <input
                    type="tel"
                    className="form-input phone-fixed-input"
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
                    onBlur={() => {
                      if (typeof window !== 'undefined') window.scrollTo({ left: 0, top: window.scrollY });
                    }}
                    required
                  />
                </div>
              </div>

              {/* Customer Name Field */}
              <div className="pos-form-group">
                <label className="form-label pos-field-label">
                  <span className="pos-label-left">
                    <User size={13} className="pos-icon-muted" /> Customer Name (Optional)
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Customer name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              {/* Payment Method Selector */}
              <div className="pos-form-group">
                <label className="form-label pos-field-label">
                  <span className="pos-label-left">
                    <CreditCard size={13} className="pos-icon-whatsapp" /> Payment Method
                  </span>
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

              {/* Primary Order Action Button */}
              <button
                type="submit"
                className="btn btn-whatsapp pos-submit-btn"
                disabled={creatingOrder || cart.length === 0}
              >
                <MessageSquare size={18} />
                <span>
                  {creatingOrder ? 'Creating Order...' : 'Create Order & Send WhatsApp Receipt'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MOBILE FLOATING BOTTOM CART BAR                           */}
      {/* ========================================================= */}
      {cart.length > 0 && activeStep === 1 && (
        <div
          className="pos-floating-checkout-bar"
          onClick={() => {
            setActiveStep(2);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          role="button"
          tabIndex={0}
          aria-label="View bill and checkout"
        >
          <div className="pos-floating-bar-left">
            <span className="pos-floating-bar-badge">
              <ShoppingBag size={15} />
              <span>{totalItemsCount}</span>
            </span>
            <div className="pos-floating-bar-totals">
              <span className="pos-floating-bar-total-amount">
                {currency}{totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
          <button type="button" className="pos-floating-bar-action-btn">
            <span>Review Order</span>
            <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* POST-ORDER SHARE FULL-SCREEN POPUP (Reference Design)     */}
      {/* ========================================================= */}
      {completedOrder && (
        <div
          className="pos-fullscreen-receipt-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pos-modal-title"
        >
          {/* Top Green Banner */}
          <div className="pos-fullscreen-banner">
            <div className="pos-fullscreen-banner-inner">
              <div className="pos-fullscreen-banner-text">
                <div className="pos-ref-banner-tag">READY TO SHARE</div>
                <h2 id="pos-modal-title" className="pos-ref-banner-title">
                  Bill generated
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCompletedOrder(null)}
                className="pos-ref-banner-close"
                title="Close receipt"
                aria-label="Close receipt"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Full Screen Scrollable Content Body */}
          <div className="pos-fullscreen-body">
            <div className="pos-fullscreen-content-container">
              {/* Saved to Billing History Pill */}
              <div className="pos-ref-saved-row">
                <span className="pos-ref-saved-icon">
                  <Check size={13} strokeWidth={3} />
                </span>
                <span>Saved to billing history</span>
              </div>

              {/* Styled Receipt Card (Matches Reference Image) */}
              <div className="pos-ref-receipt-card">
                {/* Header: Business Name & Payment Pill */}
                <div className="pos-ref-receipt-top">
                  <div className="pos-ref-receipt-business-info">
                    <h3 className="pos-ref-receipt-business-name">
                      {completedOrder.businessName}
                    </h3>
                    <div className="pos-ref-receipt-bill-no">
                      Bill {completedOrder.orderNumber}{completedOrder.businessType ? ` • ${completedOrder.businessType}` : ''}
                    </div>
                  </div>
                  <span className="pos-ref-receipt-status-pill">
                    {getPaymentBadgeLabel(completedOrder.paymentMethod)}
                  </span>
                </div>

                {completedOrder.gstNumber && (
                  <div className="pos-ref-receipt-gst">
                    GSTIN: {completedOrder.gstNumber}
                  </div>
                )}

                {/* Dashed Separator */}
                <div className="pos-ref-receipt-dashed-line" />

                {/* Itemized Product List: ALL items listed without scroll cutoff */}
                <div className="pos-ref-receipt-items">
                  {completedOrder.items && completedOrder.items.length > 0 ? (
                    completedOrder.items.map((item, idx) => (
                      <div key={idx} className="pos-ref-receipt-item-row">
                        <div className="pos-ref-item-info">
                          <span className="pos-ref-item-name">{item.productName}</span>
                          <span className="pos-ref-item-multiplier"> × {item.quantity}</span>
                        </div>
                        <span className="pos-ref-item-total">
                          {completedOrder.currency}{item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="pos-ref-receipt-item-row">
                      <span className="pos-ref-item-name">Order Items</span>
                      <span className="pos-ref-item-total">
                        {completedOrder.currency}{completedOrder.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Tax / Discount calculations if any */}
                {(completedOrder.discount > 0 || completedOrder.tax > 0) && (
                  <div className="pos-ref-receipt-calc-section">
                    {completedOrder.discount > 0 && (
                      <div className="pos-ref-receipt-calc-row is-discount">
                        <span>Discount</span>
                        <span>-{completedOrder.currency}{completedOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    {completedOrder.tax > 0 && (
                      <div className="pos-ref-receipt-calc-row">
                        <span>
                          {completedOrder.taxRate !== undefined && completedOrder.taxRate > 0
                            ? `${completedOrder.taxName || 'Tax'} (${completedOrder.taxRate}%${completedOrder.isTaxIncluded ? ' incl.' : ''})`
                            : `${completedOrder.taxName || 'Tax'}${completedOrder.isTaxIncluded ? ' (incl.)' : ''}`}
                        </span>
                        <span>
                          {completedOrder.isTaxIncluded ? '' : '+'}
                          {completedOrder.currency}
                          {completedOrder.tax.toFixed(2)}
                          {completedOrder.isTaxIncluded ? ' (Incl.)' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Solid Separator */}
                <div className="pos-ref-receipt-solid-line" />

                {/* Total Row */}
                <div className="pos-ref-receipt-total-row">
                  <span className="pos-ref-total-label">Total</span>
                  <span className="pos-ref-total-price">
                    {completedOrder.currency}{completedOrder.totalAmount.toFixed(2)}
                  </span>
                </div>

                {/* Footer Greeting */}
                <p className="pos-ref-receipt-closing">
                  Thank you for visiting! See you again soon.
                </p>
              </div>

              {/* Action Buttons: WhatsApp Share & Take Next Order */}
              <div className="pos-ref-actions-group">
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="pos-ref-btn-whatsapp"
                >
                  <Share2 size={19} />
                  <span>Share on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompletedOrder(null);
                    setActiveStep(1);
                  }}
                  className="pos-ref-btn-next"
                >
                  <RotateCcw size={16} />
                  <span>Take Next Order</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
