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
  sku?: string;
}

export interface ReceiptOptions {
  businessName: string;
  businessType?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessEmail?: string;
  currency: string;
  orderNumber: string;
  customerName?: string;
  customerPhone: string;
  customerGst?: string;
  createdAt?: Date | string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount?: number;
  totalAmount: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string;
  employee?: string;
  notes?: string;
  defaultCountryCode?: string;
  gstNumber?: string;
  showGstOnReceipt?: boolean;
  googleProfileUrl?: string;
  showGoogleReviewOnReceipt?: boolean;
  receiptUrl?: string;
  pdfUrl?: string;
}

/**
 * Builds a clean, concise WhatsApp share message with greeting,
 * invoice download link, and thanks.
 */
export function buildWhatsAppReceiptText(options: ReceiptOptions): string {
  const {
    businessName,
    orderNumber,
    customerName,
    currency = '$',
    totalAmount,
    discount,
    tax,
    gstNumber,
    showGstOnReceipt,
    pdfUrl,
    receiptUrl,
    googleProfileUrl,
    showGoogleReviewOnReceipt,
  } = options;

  const downloadLink = (receiptUrl && receiptUrl.trim()) || (pdfUrl && pdfUrl.trim()) || '';
  const customerGreeting = customerName && customerName.trim() ? customerName.trim() : 'Customer';
  const cleanBusinessName = businessName && businessName.trim() ? businessName.trim() : 'our store';

  const messageParts: string[] = [
    `Dear ${customerGreeting},`,
    `Thank you for your order with *${cleanBusinessName}*! (Order #${orderNumber})`,
  ];

  if (showGstOnReceipt && gstNumber && gstNumber.trim()) {
    messageParts.push(`*GSTIN:* ${gstNumber.trim().toUpperCase()}`);
  }

  // Matching Order Summary
  const summaryParts: string[] = [];
  if (typeof totalAmount === 'number') {
    summaryParts.push(`*Total Amount:* ${currency}${totalAmount.toFixed(2)}`);
  }
  if (typeof discount === 'number' && discount > 0) {
    summaryParts.push(`*Discount:* -${currency}${discount.toFixed(2)}`);
  }
  if (typeof tax === 'number' && tax > 0) {
    summaryParts.push(`*Tax / GST:* ${currency}${tax.toFixed(2)}`);
  }

  if (summaryParts.length > 0) {
    messageParts.push(summaryParts.join('\n'));
  }

  if (downloadLink) {
    messageParts.push(`View or download your digital receipt:\n${downloadLink}`);
  }

  if (showGoogleReviewOnReceipt && googleProfileUrl && googleProfileUrl.trim()) {
    messageParts.push(`Rate your experience on Google:\n${googleProfileUrl.trim()}`);
  }

  messageParts.push(`Thank you for choosing us!\n*${cleanBusinessName}*`);

  return messageParts.join('\n\n');
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
    options.defaultCountryCode || '91'
  );
  const rawText = buildWhatsAppReceiptText(options);
  const encodedText = encodeURIComponent(rawText);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return { cleanPhone, url, rawText };
}
