import React from 'react';
import { notFound } from 'next/navigation';
import { connectToDatabase } from '@/lib/mongodb';
import { Order } from '@/models/Order';
import { Tenant } from '@/models/Tenant';
import { generateWhatsAppUrl } from '@/lib/whatsapp';
import ReceiptView, { ReceiptItemData } from './ReceiptView';

interface ReceiptPageProps {
  params: Promise<{ orderNumber: string }>;
}

export default async function PublicReceiptPage(props: ReceiptPageProps) {
  const { orderNumber } = await props.params;
  if (!orderNumber) return notFound();

  const cleanOrderNumber = decodeURIComponent(orderNumber).trim();
  await connectToDatabase();

  const order = await Order.findOne({
    orderNumber: { $regex: new RegExp(`^${cleanOrderNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  });
  if (!order) return notFound();

  const tenant = await Tenant.findById(order.tenantId);

  const businessName = tenant?.businessName || 'Business Receipt';
  const businessAddress = tenant?.address || '';
  const businessPhone = tenant?.phone || '';
  const currency = order.currency || tenant?.currency || '$';

  const showGst = tenant ? Boolean(tenant.showGstOnReceipt) : Boolean(order.gstNumber);
  const gstNumber = order.gstNumber || (tenant ? tenant.gstNumber : '');

  const showGoogle = tenant ? Boolean(tenant.showGoogleReviewOnReceipt) : Boolean(order.googleProfileUrl);
  const googleProfileUrl = order.googleProfileUrl || (tenant ? tenant.googleProfileUrl : '');

  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || '';
  const receiptUrl = `${envAppUrl}/receipt/${order.orderNumber}`;
  const pdfUrl = `${envAppUrl}/api/receipts/${order.orderNumber}/pdf`;

  const { url: whatsappUrl } = generateWhatsAppUrl({
    businessName,
    businessType: tenant?.businessType || '',
    businessPhone,
    businessAddress,
    currency,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    createdAt: order.createdAt,
    items: (order.items || []).map((i: any) => ({
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      sku: i.sku || '',
    })),
    subtotal: order.subtotal,
    tax: order.tax,
    discount: order.discount,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    employee: order.employee || tenant?.defaultEmployee,
    notes: order.notes,
    defaultCountryCode: tenant?.countryCode || '91',
    gstNumber,
    showGstOnReceipt: showGst,
    googleProfileUrl,
    showGoogleReviewOnReceipt: showGoogle,
    receiptUrl,
    pdfUrl,
  });

  const serializedItems: ReceiptItemData[] = (order.items || []).map((i: any) => ({
    productName: i.productName || 'Custom Item',
    quantity: Number(i.quantity || 1),
    unitPrice: Number(i.unitPrice || 0),
    lineTotal: Number(i.lineTotal || 0),
    sku: i.sku || undefined,
    discount: i.discount ? Number(i.discount) : undefined,
  }));

  return (
    <ReceiptView
      orderNumber={order.orderNumber}
      customerName={order.customerName || 'Valued Customer'}
      customerPhone={order.customerPhone || ''}
      customerEmail={order.customerEmail || undefined}
      notes={order.notes || undefined}
      createdAt={order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString()}
      items={serializedItems}
      subtotal={Number(order.subtotal || 0)}
      tax={Number(order.tax || 0)}
      taxRate={order.taxRate !== undefined ? order.taxRate : (tenant?.defaultTaxRate !== undefined ? tenant.defaultTaxRate : (order.tax > 0 ? 18 : 0))}
      taxName={order.taxName || order.tax1Name || tenant?.defaultTaxName || 'GST'}
      discount={Number(order.discount || 0)}
      totalAmount={Number(order.totalAmount || 0)}
      currency={currency}
      paymentStatus={order.paymentStatus || 'PAID'}
      paymentMethod={order.paymentMethod || undefined}
      paymentReference={order.paymentReference || undefined}
      paymentId={order.paymentId || undefined}
      gstNumber={gstNumber || undefined}
      showGst={showGst}
      googleProfileUrl={googleProfileUrl || undefined}
      showGoogle={showGoogle}
      businessName={businessName}
      businessAddress={businessAddress || undefined}
      businessPhone={businessPhone || undefined}
      whatsappUrl={whatsappUrl}
      receiptUrl={receiptUrl}
    />
  );
}
