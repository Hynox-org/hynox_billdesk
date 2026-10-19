/**
 * Sanitizes phone numbers for WhatsApp wa.me links.
 * Strips all non-digit characters (+, -, spaces, parentheses).
 * If the user enters a 10-digit number without country code, prefixes with defaultCountryCode.
 */
export function sanitizeWhatsAppPhone(phone: string, defaultCountryCode: string = '1'): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return '';

  // If 10 digits (common for US, India, etc.), prepend country code if not present
  if (digitsOnly.length === 10) {
    return `${defaultCountryCode.replace(/\D/g, '')}${digitsOnly}`;
  }

  return digitsOnly;
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptOptions {
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  currency: string;
  orderNumber: string;
  customerName?: string;
  customerPhone: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  totalAmount: number;
  paymentStatus?: string;
  paymentMethod?: string;
  defaultCountryCode?: string;
  gstNumber?: string;
  showGstOnReceipt?: boolean;
  googleProfileUrl?: string;
  showGoogleReviewOnReceipt?: boolean;
  receiptUrl?: string;
}

/**
 * Builds a deterministic, beautifully formatted WhatsApp text receipt
 * using standard WhatsApp markdown (*bold*, _italic_, etc.)
 */
export function buildWhatsAppReceiptText(options: ReceiptOptions): string {
  const {
    businessName,
    businessPhone,
    businessAddress,
    currency,
    orderNumber,
    customerName,
    items,
    subtotal,
    tax,
    discount = 0,
    totalAmount,
    paymentStatus = 'PAID_CASH',
    paymentMethod,
    gstNumber,
    showGstOnReceipt,
    googleProfileUrl,
    showGoogleReviewOnReceipt,
    receiptUrl,
  } = options;

  const dateStr = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const paymentLabels: Record<string, string> = {
    CASH: 'Paid via Cash',
    CARD: 'Paid via Card',
    UPI: 'Paid via UPI / QR',
    PAID_CASH: 'Paid via Cash',
    PAID_ONLINE: 'Paid Online / Card / UPI',
    PENDING: 'Payment Pending / Pay Later',
    COD: 'Cash on Delivery',
  };

  const paymentStr =
    (paymentMethod && paymentLabels[paymentMethod]) ||
    paymentLabels[paymentStatus] ||
    paymentStatus;

  const itemLines = items
    .map(
      (item) =>
        `• *${item.productName}*\n  ${item.quantity} x ${currency}${item.unitPrice.toFixed(
          2
        )} = *${currency}${item.lineTotal.toFixed(2)}*`
    )
    .join('\n');

  let breakdown = `Subtotal: ${currency}${subtotal.toFixed(2)}`;
  if (tax > 0) {
    breakdown += `\nTax: ${currency}${tax.toFixed(2)}`;
  }
  if (discount > 0) {
    breakdown += `\nDiscount: -${currency}${discount.toFixed(2)}`;
  }

  const gstLine = showGstOnReceipt && gstNumber && gstNumber.trim() ? `GST: ${gstNumber.trim()}\n` : '';
  const addressLine = businessAddress && businessAddress.trim() ? `Address: ${businessAddress.trim()}\n` : '';
  const phoneLine = businessPhone && businessPhone.trim() ? `Contact: ${businessPhone.trim()}\n` : '';
  const pdfLine = receiptUrl && receiptUrl.trim() ? `\nView / Download PDF Invoice:\n${receiptUrl.trim()}\n` : '';
  const reviewLine =
    showGoogleReviewOnReceipt && googleProfileUrl && googleProfileUrl.trim()
      ? `\n*Review us on Google:*\n${googleProfileUrl.trim()}\n`
      : '';

  const receipt = `*RECEIPT: #${orderNumber}*
*${businessName}*
${addressLine}${phoneLine}${gstLine}Date: ${dateStr}
Customer: ${customerName || 'Valued Customer'}
━━━━━━━━━━━━━━━━━━━━
${itemLines}
━━━━━━━━━━━━━━━━━━━━
${breakdown}
*TOTAL: ${currency}${totalAmount.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━
Payment: ${paymentStr}${pdfLine}${reviewLine}
_Thank you for your order!_`;

  return receipt;
}

/**
 * Generates the clickable wa.me URL
 */
export function generateWhatsAppUrl(options: ReceiptOptions): {
  cleanPhone: string;
  url: string;
  rawText: string;
} {
  const cleanPhone = sanitizeWhatsAppPhone(
    options.customerPhone,
    options.defaultCountryCode || '1'
  );
  const rawText = buildWhatsAppReceiptText(options);
  const encodedText = encodeURIComponent(rawText);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return { cleanPhone, url, rawText };
}
