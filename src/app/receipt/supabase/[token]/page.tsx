import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getPublicReceiptByIdentifier } from '@/lib/supabase';
import ReceiptView, { ReceiptItemData } from '../../[orderNumber]/ReceiptView';

interface ReceiptPageProps {
  params: Promise<{ token: string }>;
}

export default async function SupabaseReceiptPage({ params }: ReceiptPageProps) {
  const { token } = await params;
  const clean = decodeURIComponent(token || '').trim();
  if (!clean) return notFound();

  let order = await getPublicReceiptByIdentifier(clean);

  // If not resolved via direct RPC, fallback to edge function json format
  if (!order) {
    const receiptApi =
      process.env.SUPABASE_PUBLIC_RECEIPT_URL ||
      'https://ahnuolokraefnmtqahhn.supabase.co/functions/v1/public-receipt';
    try {
      const response = await fetch(
        `${receiptApi}?token=${encodeURIComponent(clean)}&format=json`,
        { next: { revalidate: 300 } },
      );
      if (response.ok) {
        order = await response.json();
      }
    } catch {
      // ignore
    }
  }

  if (!order) return notFound();

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || `${proto}://${host}`).replace(/\/+$/, '');

  const displayOrderNumber = order.order_number || clean;
  const receiptUrl = `${base}/receipt/${encodeURIComponent(displayOrderNumber)}`;
  const pdfUrl = `${base}/api/receipts/${encodeURIComponent(displayOrderNumber)}/pdf`;
  const customerPhone = String(order.customer_phone || '').replace(/\D/g, '');

  const customerGreeting = order.customer_name ? `Dear ${order.customer_name},` : 'Hello,';
  const businessLabel = order.business_name || 'our store';
  const currencySymbol = order.currency || '$';
  const totalStr = Number(order.total_amount || 0).toFixed(2);
  const whatsappText = [
    customerGreeting,
    `Thank you for your order with *${businessLabel}*! (Order #${displayOrderNumber})`,
    `*Total Amount:* ${currencySymbol}${totalStr}`,
    `View or download your digital receipt:\n${receiptUrl}`,
  ].join('\n\n');
  const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(whatsappText)}`;

  const items: ReceiptItemData[] = (order.items || []).map((item: any) => {
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unit_price || item.unitPrice || 0);
    const lineTotal = Number(item.line_total || item.lineTotal || (qty * unitPrice));
    return {
      productName: String(item.product_name || item.name || item.productName || 'Custom Item'),
      quantity: qty,
      unitPrice,
      lineTotal,
      sku: item.sku || undefined,
    };
  });

  return (
    <ReceiptView
      orderNumber={displayOrderNumber}
      customerName={order.customer_name || 'Valued Customer'}
      customerPhone={customerPhone}
      customerEmail={order.customer_email || undefined}
      notes={order.notes || undefined}
      createdAt={order.created_at || new Date().toISOString()}
      items={items}
      subtotal={Number(order.subtotal || 0)}
      tax={Number(order.tax || 0)}
      taxRate={order.tax_rate !== undefined ? Number(order.tax_rate) : undefined}
      taxName={order.tax_name || 'GST'}
      isTaxIncluded={Boolean(order.is_tax_included)}
      taxType={order.tax_type}
      discount={Number(order.discount || 0)}
      totalAmount={Number(order.total_amount || 0)}
      currency={currencySymbol}
      paymentStatus={order.payment_status || 'PAID'}
      paymentMethod={order.payment_method || undefined}
      paymentReference={order.payment_reference || undefined}
      paymentId={order.payment_id || undefined}
      gstNumber={order.gst_number || undefined}
      showGst={Boolean(order.show_gst)}
      googleProfileUrl={order.google_profile_url || undefined}
      showGoogle={Boolean(order.show_google)}
      businessName={businessLabel}
      businessAddress={order.business_address || undefined}
      businessPhone={order.business_phone || undefined}
      whatsappUrl={whatsappUrl}
      receiptUrl={receiptUrl}
      pdfUrl={pdfUrl}
    />
  );
}
