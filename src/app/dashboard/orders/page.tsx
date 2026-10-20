'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  MessageSquare,
  ExternalLink,
  Copy,
  Clock,
  Phone,
  CheckCircle2,
  Receipt,
  X,
  Check,
  FileText,
  Download,
  Search,
  Filter,
  Calendar,
  Trash2,
  AlertTriangle,
  RotateCcw,
  CheckSquare,
  Square,
  ChevronRight,
  FileSpreadsheet,
  Smartphone,
} from 'lucide-react';

interface OrderItem {
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  currency?: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
}

type DatePreset = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export default function OrdersPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Long-Press Detection Refs
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Action States
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharingPdf, setSharingPdf] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState<{
    orderNumber: string;
    rawText: string;
    whatsappUrl: string;
    phone: string;
    totalAmount: number;
    pdfUrl?: string;
    orderId: string;
  } | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    orderIds: string[];
    orderNumbers: string[];
    isDeleting: boolean;
  }>({
    isOpen: false,
    orderIds: [],
    orderNumbers: [],
    isDeleting: false,
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/orders?limit=1000');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        if (data.currency) setCurrency(data.currency);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter Logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 86400000 - 1;

    const yesterdayStart = todayStart - 86400000;
    const yesterdayEnd = todayStart - 1;

    const weekStart = todayStart - 6 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return orders.filter((order) => {
      const orderTime = new Date(order.createdAt).getTime();

      // 1. Date Preset Filter
      if (datePreset === 'TODAY') {
        if (orderTime < todayStart || orderTime > todayEnd) return false;
      } else if (datePreset === 'YESTERDAY') {
        if (orderTime < yesterdayStart || orderTime > yesterdayEnd) return false;
      } else if (datePreset === 'WEEK') {
        if (orderTime < weekStart) return false;
      } else if (datePreset === 'MONTH') {
        if (orderTime < monthStart) return false;
      } else if (datePreset === 'CUSTOM') {
        if (customStartDate) {
          const start = new Date(`${customStartDate}T00:00:00`).getTime();
          if (orderTime < start) return false;
        }
        if (customEndDate) {
          const end = new Date(`${customEndDate}T23:59:59.999`).getTime();
          if (orderTime > end) return false;
        }
      }

      // 2. Status & Payment Filter
      if (statusFilter !== 'ALL') {
        const pStatus = (order.paymentStatus || '').toUpperCase();
        const pMethod = (order.paymentMethod || '').toUpperCase();
        if (statusFilter === 'PAID') {
          if (!pStatus.includes('PAID') && pStatus !== 'COMPLETED') return false;
        } else if (statusFilter === 'PENDING') {
          if (pStatus !== 'PENDING') return false;
        } else if (statusFilter === 'CASH') {
          if (pStatus !== 'PAID_CASH' && pMethod !== 'CASH') return false;
        } else if (statusFilter === 'ONLINE') {
          if (
            pStatus !== 'PAID_ONLINE' &&
            pMethod !== 'CARD' &&
            pMethod !== 'UPI' &&
            !pStatus.includes('ONLINE')
          ) {
            return false;
          }
        }
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesNumber = (order.orderNumber || '').toLowerCase().includes(query);
        const matchesCustomer = (order.customerName || '').toLowerCase().includes(query);
        const matchesPhone = (order.customerPhone || '').toLowerCase().includes(query);
        const matchesItems = order.items.some((i) =>
          (i.productName || '').toLowerCase().includes(query)
        );
        if (!matchesNumber && !matchesCustomer && !matchesPhone && !matchesItems) {
          return false;
        }
      }

      return true;
    });
  }, [orders, datePreset, customStartDate, customEndDate, statusFilter, searchQuery]);

  // Dynamic KPI Stats based on current filtered results
  const filteredStats = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const count = filteredOrders.length;
    const avgTicket = count > 0 ? totalRevenue / count : 0;
    return {
      revenue: totalRevenue,
      count,
      avgTicket,
    };
  }, [filteredOrders]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (datePreset !== 'ALL') count++;
    if (statusFilter !== 'ALL') count++;
    return count;
  }, [searchQuery, datePreset, statusFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDatePreset('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('ALL');
  };

  // Selection Handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map((o) => o._id));
    }
  };

  const handleToggleSelect = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  // Long-Press Handlers for Mobile & Desktop
  const startLongPress = (orderId: string, clientX: number, clientY: number) => {
    longPressTriggeredRef.current = false;
    touchStartPosRef.current = { x: clientX, y: clientY };

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      handleToggleSelect(orderId);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch (_) {}
      }
    }, 450);
  };

  const cancelLongPressOnMove = (clientX: number, clientY: number) => {
    if (!longPressTimerRef.current) return;
    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const endLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleOrderClick = (order: Order, e: React.MouseEvent) => {
    // If this click was triggered immediately after a long press, ignore it
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    // In multi-selection mode, tapping the card toggles its selection state
    if (selectedIds.length > 0) {
      handleToggleSelect(order._id);
      return;
    }

    // Normal mode: navigate to individual receipt page
    router.push(`/receipt/${order.orderNumber}`);
  };

  // Excel Export Handler
  const handleExportExcel = (ordersToExport?: Order[]) => {
    setExporting(true);
    try {
      const targets =
        ordersToExport && ordersToExport.length > 0
          ? ordersToExport
          : selectedIds.length > 0
          ? orders.filter((o) => selectedIds.includes(o._id))
          : filteredOrders;

      if (targets.length === 0) {
        alert('No orders available to export.');
        return;
      }

      const rows = targets.map((o) => {
        const dateObj = new Date(o.createdAt);
        return {
          'Order Number': o.orderNumber,
          'Date': dateObj.toLocaleDateString(),
          'Time': dateObj.toLocaleTimeString(),
          'Customer Name': o.customerName || 'Valued Customer',
          'Customer Phone': o.customerPhone ? `+${o.customerPhone}` : '',
          'Items Summary': o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', '),
          'Total Items': o.items.reduce((acc, i) => acc + (i.quantity || 1), 0),
          'Subtotal': Number((o.subtotal || 0).toFixed(2)),
          'Discount': Number((o.discount || 0).toFixed(2)),
          'Tax': Number((o.tax || 0).toFixed(2)),
          'Total Amount': Number((o.totalAmount || 0).toFixed(2)),
          'Currency': o.currency || currency,
          'Payment Status': o.paymentStatus || 'PAID',
          'Payment Method': o.paymentMethod || o.paymentStatus || 'CASH',
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-fit column widths
      worksheet['!cols'] = [
        { wch: 16 }, // Order Number
        { wch: 12 }, // Date
        { wch: 12 }, // Time
        { wch: 20 }, // Customer Name
        { wch: 16 }, // Customer Phone
        { wch: 36 }, // Items Summary
        { wch: 12 }, // Total Items
        { wch: 12 }, // Subtotal
        { wch: 10 }, // Discount
        { wch: 10 }, // Tax
        { wch: 14 }, // Total Amount
        { wch: 10 }, // Currency
        { wch: 16 }, // Payment Status
        { wch: 16 }, // Payment Method
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Orders_Export_${dateStr}.xlsx`);
    } catch (err) {
      console.error('Failed to export Excel file:', err);
      alert('Failed to generate Excel export file.');
    } finally {
      setExporting(false);
    }
  };

  // Delete Handlers
  const handleOpenDeleteConfirm = (orderIds: string[], e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const matchingNumbers = orders
      .filter((o) => orderIds.includes(o._id))
      .map((o) => o.orderNumber);

    setDeleteConfirm({
      isOpen: true,
      orderIds,
      orderNumbers: matchingNumbers,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: deleteConfirm.orderIds }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete orders');
      }

      // Remove from local state
      const deletedSet = new Set(deleteConfirm.orderIds);
      setOrders((prev) => prev.filter((o) => !deletedSet.has(o._id)));
      setSelectedIds((prev) => prev.filter((id) => !deletedSet.has(id)));

      if (selectedReceipt && deletedSet.has(selectedReceipt.orderId)) {
        setSelectedReceipt(null);
      }

      setDeleteConfirm({ isOpen: false, orderIds: [], orderNumbers: [], isDeleting: false });
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Error occurred while deleting orders.');
      setDeleteConfirm((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // WhatsApp and Receipt Modals
  const handleResendWhatsApp = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setResendingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResendingId(null);
    }
  };

  const handleViewReceipt = async (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setViewingId(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.rawReceiptText) {
        const order = orders.find((o) => o._id === orderId);
        setSelectedReceipt({
          orderNumber: order?.orderNumber || '',
          rawText: data.rawReceiptText,
          whatsappUrl: data.whatsappUrl,
          phone: order?.customerPhone || '',
          totalAmount: order?.totalAmount || 0,
          pdfUrl: data.pdfUrl || `/api/receipts/${order?.orderNumber}/pdf`,
          orderId,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setViewingId(null);
    }
  };

  const handleSharePdf = async () => {
    if (!selectedReceipt) return;
    setSharingPdf(true);
    try {
      const pdfEndpoint =
        selectedReceipt.pdfUrl || `/api/receipts/${selectedReceipt.orderNumber}/pdf`;
      const res = await fetch(pdfEndpoint);
      if (!res.ok) throw new Error('Failed to load PDF');
      const blob = await res.blob();
      const file = new File([blob], `Receipt-${selectedReceipt.orderNumber}.pdf`, {
        type: 'application/pdf',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt #${selectedReceipt.orderNumber}`,
          text: `Invoice #${selectedReceipt.orderNumber}`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt-${selectedReceipt.orderNumber}.pdf`;
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
    if (selectedReceipt) {
      navigator.clipboard.writeText(selectedReceipt.rawText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isSelectionActive = selectedIds.length > 0;

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '22px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Receipt size={28} style={{ color: 'var(--primary)' }} />
            <span>Orders</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleExportExcel()}
            disabled={exporting || filteredOrders.length === 0}
            className="btn btn-secondary"
            style={{ gap: '6px' }}
            title="Export orders to Excel format"
          >
            <FileSpreadsheet size={16} style={{ color: 'var(--emerald)' }} />
            <span>
              {isSelectionActive
                ? `Export Selected (${selectedIds.length})`
                : `Export Filtered (${filteredOrders.length})`}
            </span>
          </button>

          <Link href="/dashboard/pos" className="btn btn-primary" style={{ gap: '6px' }}>
            <ShoppingBag size={16} />
            <span>New Order</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards (Dynamic to Active Filter) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '22px',
        }}
      >
        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Filtered Revenue
            </span>
            <DollarSign size={18} style={{ color: 'var(--emerald)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}
            {filteredStats.revenue.toFixed(2)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Matching Orders
            </span>
            <ShoppingBag size={18} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {filteredStats.count}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px 20px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Average Ticket
            </span>
            <TrendingUp size={18} style={{ color: 'var(--whatsapp)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}
            {filteredStats.avgTicket.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Complete Fixed and Custom Filters Container */}
      <div className="orders-filter-container">
        {/* Top Row: Search + Status Dropdown + Clear Filters */}
        <div className="orders-filter-top-row">
          <div className="orders-search-wrapper">
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search orders, customers, or items..."
              className="form-input"
              style={{ paddingLeft: '38px', height: '40px', fontSize: '0.88rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input"
              style={{ height: '40px', fontSize: '0.88rem' }}
            >
              <option value="ALL">All Payment Statuses</option>
              <option value="PAID">All Paid</option>
              <option value="CASH">Paid via Cash</option>
              <option value="ONLINE">Paid via Card / UPI</option>
              <option value="PENDING">Payment Pending</option>
            </select>
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary btn-sm"
              style={{ height: '40px', gap: '6px' }}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset Filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>

        {/* Date Presets Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Calendar size={14} />
            </span>
            <div className="orders-preset-group">
              {(
                [
                  ['ALL', 'All Time'],
                  ['TODAY', 'Today'],
                  ['YESTERDAY', 'Yesterday'],
                  ['WEEK', 'Last 7 Days'],
                  ['MONTH', 'This Month'],
                  ['CUSTOM', 'Custom Range'],
                ] as const
              ).map(([presetKey, label]) => (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => setDatePreset(presetKey)}
                  className={`orders-preset-btn ${datePreset === presetKey ? 'active' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
          </span>
        </div>

        {/* Custom Date Pickers (Shown when CUSTOM is selected) */}
        {datePreset === 'CUSTOM' && (
          <div className="orders-custom-dates">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                From:
              </span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                To:
              </span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.85rem' }}
              />
            </div>

            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.78rem' }}
              >
                Clear Dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Multi-Select Action Banner (Sticky on Mobile, Appears when items are selected) */}
      {isSelectionActive && (
        <div className="orders-selection-bar mobile-selection-bar-sticky">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: 'var(--emerald)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
              }}
            >
              {selectedIds.length}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                {selectedIds.length} order{selectedIds.length === 1 ? '' : 's'} selected
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Tap items to toggle • Multi-select mode active
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleExportExcel()}
              disabled={exporting}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px' }}
            >
              <FileSpreadsheet size={15} style={{ color: 'var(--emerald)' }} />
              <span>Export ({selectedIds.length})</span>
            </button>

            <button
              type="button"
              onClick={(e) => handleOpenDeleteConfirm(selectedIds, e)}
              className="btn btn-secondary btn-sm"
              style={{ gap: '6px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="btn btn-secondary btn-sm"
            >
              Exit Selection
            </button>
          </div>
        </div>
      )}

      {/* Mobile Hint and Multi-Select Status Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        {!isSelectionActive ? (
          <div className="longpress-hint-pill" style={{ margin: 0 }}>
            <CheckSquare size={13} style={{ color: '#60a5fa' }} />
            <span>Long-press any order to multi-select</span>
          </div>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} />
            <span>Multi-select active</span>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.78rem', padding: '4px 10px', height: 'auto', marginLeft: 'auto' }}
          >
            {selectedIds.length === filteredOrders.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Main Content: Dual Desktop Table & Mobile Cards */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading store orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center' }}>
            <Receipt size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0' }}>
              No orders found
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              {orders.length === 0
                ? 'No transactions recorded yet. Create an order in the New Order page.'
                : 'No orders matched your current filters. Try resetting the search or date presets.'}
            </p>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '14px' }}
              >
                Clear Active Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View (>850px) */}
            <div className="orders-table-desktop">
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: 'var(--emerald-deep)',
                        borderBottom: '1px solid var(--border-subtle)',
                      }}
                    >
                      <th style={{ width: '42px', padding: '12px 14px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={
                            selectedIds.length === filteredOrders.length &&
                            filteredOrders.length > 0
                          }
                          onChange={handleToggleSelectAll}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          title="Select all matching orders"
                        />
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        Order ID
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        Date &amp; Time
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        Customer
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        Items
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        Total
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                        }}
                      >
                        Status
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          textAlign: 'right',
                        }}
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const isSelected = selectedIds.includes(o._id);
                      return (
                        <tr
                          key={o._id}
                          onTouchStart={(e) =>
                            startLongPress(o._id, e.touches[0].clientX, e.touches[0].clientY)
                          }
                          onTouchMove={(e) =>
                            cancelLongPressOnMove(e.touches[0].clientX, e.touches[0].clientY)
                          }
                          onTouchEnd={endLongPress}
                          onTouchCancel={endLongPress}
                          onMouseDown={(e) => {
                            if (e.button === 0) startLongPress(o._id, e.clientX, e.clientY);
                          }}
                          onMouseMove={(e) => cancelLongPressOnMove(e.clientX, e.clientY)}
                          onMouseUp={endLongPress}
                          onMouseLeave={endLongPress}
                          onContextMenu={(e) => {
                            if (longPressTriggeredRef.current) e.preventDefault();
                          }}
                          onClick={(e) => handleOrderClick(o, e)}
                          className={`orders-clickable-row ${isSelected ? 'selected-row' : ''}`}
                          style={{
                            borderBottom: '1px solid var(--border-subtle)',
                          }}
                          title={
                            isSelectionActive
                              ? 'Click to toggle selection'
                              : 'Click row to open individual receipt page, or hold to select'
                          }
                        >
                          <td
                            style={{ padding: '14px', textAlign: 'center' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(o._id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div
                              style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                color: 'var(--primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span>{o.orderNumber}</span>
                              <ExternalLink size={12} style={{ opacity: 0.6 }} />
                            </div>
                          </td>

                          <td
                            style={{
                              padding: '14px 16px',
                              color: 'var(--text-secondary)',
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {new Date(o.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                              {o.customerName || 'Valued Customer'}
                            </div>
                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: 'var(--whatsapp)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              +{o.customerPhone}
                            </div>
                          </td>

                          <td
                            style={{
                              padding: '14px 16px',
                              color: 'var(--text-secondary)',
                              fontSize: '0.85rem',
                              maxWidth: '220px',
                            }}
                          >
                            <div
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {o.items.reduce((sum, i) => sum + (i.quantity || 1), 0)} item
                              {o.items.reduce((sum, i) => sum + (i.quantity || 1), 0) === 1
                                ? ''
                                : 's'}
                            </span>
                          </td>

                          <td
                            style={{
                              padding: '14px 16px',
                              fontWeight: 800,
                              color: 'var(--emerald)',
                              fontSize: '0.95rem',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {o.currency || currency}
                            {o.totalAmount.toFixed(2)}
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span
                              className="badge badge-pro"
                              style={{ fontSize: '0.68rem', letterSpacing: '0.02em' }}
                            >
                              {o.paymentMethod || o.paymentStatus}
                            </span>
                          </td>

                          <td
                            style={{ padding: '14px 16px', textAlign: 'right' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '6px',
                                flexWrap: 'wrap',
                              }}
                            >
                              <button
                                type="button"
                                onClick={(e) => handleViewReceipt(o._id, e)}
                                disabled={viewingId === o._id}
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '5px 9px', fontSize: '0.78rem', gap: '4px' }}
                                title="View order receipt modal"
                              >
                                <Receipt size={13} />
                                <span>{viewingId === o._id ? '...' : 'View'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleResendWhatsApp(o._id, e)}
                                disabled={resendingId === o._id}
                                className="btn btn-whatsapp btn-sm"
                                style={{ padding: '5px 10px', fontSize: '0.78rem', gap: '4px' }}
                                title="Open digital receipt in WhatsApp"
                              >
                                <MessageSquare size={13} />
                                <span>WhatsApp</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleOpenDeleteConfirm([o._id], e)}
                                className="btn btn-secondary btn-sm"
                                style={{
                                  padding: '5px 8px',
                                  color: 'var(--danger)',
                                  borderColor: 'rgba(239, 68, 68, 0.25)',
                                }}
                                title="Delete order"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile & Tablet Card View (<=850px) */}
            <div className="orders-cards-mobile" style={{ padding: '14px' }}>
              {filteredOrders.map((o) => {
                const isSelected = selectedIds.includes(o._id);
                return (
                  <div
                    key={o._id}
                    onTouchStart={(e) =>
                      startLongPress(o._id, e.touches[0].clientX, e.touches[0].clientY)
                    }
                    onTouchMove={(e) =>
                      cancelLongPressOnMove(e.touches[0].clientX, e.touches[0].clientY)
                    }
                    onTouchEnd={endLongPress}
                    onTouchCancel={endLongPress}
                    onMouseDown={(e) => {
                      if (e.button === 0) startLongPress(o._id, e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => cancelLongPressOnMove(e.clientX, e.clientY)}
                    onMouseUp={endLongPress}
                    onMouseLeave={endLongPress}
                    onContextMenu={(e) => {
                      if (longPressTriggeredRef.current) e.preventDefault();
                    }}
                    onClick={(e) => handleOrderClick(o, e)}
                    className={`order-mobile-card ${isSelected ? 'selected-card' : ''}`}
                  >
                    {/* Card Top: Checkbox, Order Number, Status / Selected Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        marginBottom: '10px',
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(o._id)}
                          style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                        />
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 700,
                            color: 'var(--primary)',
                            fontSize: '0.95rem',
                          }}
                        >
                          {o.orderNumber}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isSelected ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              background: 'var(--emerald)',
                              color: '#fff',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                            }}
                          >
                            <Check size={11} />
                            Selected
                          </span>
                        ) : (
                          <span className="badge badge-pro" style={{ fontSize: '0.65rem' }}>
                            {o.paymentMethod || o.paymentStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Middle: Customer info + Timestamp */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '12px',
                        marginBottom: '10px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {o.customerName || 'Valued Customer'}
                        </div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--whatsapp)',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          +{o.customerPhone}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '1.2rem',
                            fontWeight: 800,
                            color: 'var(--emerald)',
                          }}
                        >
                          {o.currency || currency}
                          {o.totalAmount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(o.createdAt).toLocaleDateString()}{' '}
                          {new Date(o.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Items snippet */}
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '12px',
                        background: 'var(--bg-input)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                      }}
                    >
                      {o.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                    </div>

                    {/* Card Actions */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        flexWrap: 'wrap',
                        borderTop: '1px solid var(--border-subtle)',
                        paddingTop: '10px',
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => router.push(`/receipt/${o.orderNumber}`)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem', gap: '4px' }}
                      >
                        <ExternalLink size={13} />
                        <span>Receipt Page</span>
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={(e) => handleViewReceipt(o._id, e)}
                          disabled={viewingId === o._id}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <Receipt size={13} />
                          <span>{viewingId === o._id ? '...' : 'View'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleResendWhatsApp(o._id, e)}
                          disabled={resendingId === o._id}
                          className="btn btn-whatsapp btn-sm"
                          style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenDeleteConfirm([o._id], e)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '6px 8px',
                            color: 'var(--danger)',
                            borderColor: 'rgba(239, 68, 68, 0.25)',
                          }}
                        >
                          <Trash2 size={13} />
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: 'var(--danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                  Confirm Order Deletion
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Permanent removal from database
                </span>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Are you sure you want to permanently delete{' '}
              <strong>
                {deleteConfirm.orderIds.length} order{deleteConfirm.orderIds.length === 1 ? '' : 's'}
              </strong>
              ?
            </p>

            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '0.8rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                marginBottom: '16px',
                maxHeight: '100px',
                overflowY: 'auto',
              }}
            >
              {deleteConfirm.orderNumbers.slice(0, 8).join(', ')}
              {deleteConfirm.orderNumbers.length > 8 &&
                ` and ${deleteConfirm.orderNumbers.length - 8} more...`}
            </div>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.78rem',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>This action cannot be undone. Associated records will be wiped.</span>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm({ isOpen: false, orderIds: [], orderNumbers: [], isDeleting: false })}
                disabled={deleteConfirm.isDeleting}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirm.isDeleting}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  background: 'var(--danger)',
                  borderColor: 'var(--danger)',
                }}
              >
                {deleteConfirm.isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal-content pos-receipt-modal" style={{ maxWidth: '480px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: 'rgba(37, 211, 102, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--whatsapp)',
                  }}
                >
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    Receipt #{selectedReceipt.orderNumber}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Phone: {selectedReceipt.phone}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '4px 8px', borderRadius: '8px' }}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Receipt Preview */}
            <div
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: '12px',
                padding: '14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.82rem',
                color: 'var(--text-main)',
                whiteSpace: 'pre-line',
                maxHeight: '300px',
                overflowY: 'auto',
                marginBottom: '16px',
                lineHeight: 1.45,
              }}
            >
              {selectedReceipt.rawText}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.open(selectedReceipt.whatsappUrl, '_blank', 'noopener,noreferrer')}
                className="btn btn-whatsapp"
                style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
              >
                <MessageSquare size={16} />
                <span>Open in WhatsApp</span>
                <ExternalLink size={14} />
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSharePdf}
                  disabled={sharingPdf}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', gap: '5px' }}
                  title="Share PDF file to WhatsApp or device apps"
                >
                  <FileText size={15} style={{ color: 'var(--whatsapp)' }} />
                  <span>{sharingPdf ? 'Sharing...' : 'Share PDF'}</span>
                </button>

                <a
                  href={selectedReceipt.pdfUrl || `/api/receipts/${selectedReceipt.orderNumber}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', gap: '5px', textDecoration: 'none' }}
                  title="Download PDF invoice directly"
                >
                  <Download size={15} />
                  <span>Download PDF</span>
                </a>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => router.push(`/receipt/${selectedReceipt.orderNumber}`)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', gap: '6px' }}
                  title="Open full interactive receipt page"
                >
                  <ExternalLink size={14} />
                  <span>View Public Page</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {copied ? (
                    <Check size={16} style={{ color: 'var(--whatsapp)' }} />
                  ) : (
                    <Copy size={16} />
                  )}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={(e) => handleOpenDeleteConfirm([selectedReceipt.orderId], e)}
                  className="btn btn-secondary"
                  style={{
                    color: 'var(--danger)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    padding: '8px',
                    fontSize: '0.85rem',
                  }}
                >
                  <Trash2 size={15} />
                  <span>Delete Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
