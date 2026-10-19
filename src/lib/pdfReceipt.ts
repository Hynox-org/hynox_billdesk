import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ReceiptPdfItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptPdfData {
  orderNumber: string;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: Date | string;
  items: ReceiptPdfItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  paymentStatus?: string;
  paymentMethod?: string;
  gstNumber?: string;
  showGstOnReceipt?: boolean;
  googleProfileUrl?: string;
  showGoogleReviewOnReceipt?: boolean;
}

/**
 * Standard PDF fonts (Helvetica) only support standard WinAnsi / Latin-1 characters.
 * This helper normalizes unicode quotes, Indian Rupee symbol, em-dashes, and strips
 * unsupported codepoints so PDF rendering never throws WinAnsi encoding errors.
 */
function safePdfText(text: string | undefined | null): string {
  if (!text) return '';
  return String(text)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/₹/g, 'Rs. ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '')
    .trim();
}

function safePdfCurrency(curr: string | undefined | null): string {
  if (!curr) return '$ ';
  if (curr.includes('₹') || curr === '₹') return 'Rs. ';
  const cleaned = curr.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
  return cleaned ? `${cleaned} ` : '$ ';
}

/**
 * Generates an official, clean A5-format invoice PDF using pdf-lib
 */
export async function generateReceiptPdf(data: ReceiptPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // A5 dimensions: 420pt x 595pt (half of A4, ideal for digital receipt & thermal viewing)
  const pageWidth = 420;
  // Calculate dynamic page height if many items, minimum 595pt
  const minHeight = 595;
  const itemsHeight = Math.max(0, data.items.length - 6) * 22;
  const pageHeight = minHeight + itemsHeight;

  const page = doc.addPage([pageWidth, pageHeight]);

  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Palette
  const colorDark = rgb(0.08, 0.12, 0.18);
  const colorSecondary = rgb(0.38, 0.44, 0.52);
  const colorMuted = rgb(0.55, 0.60, 0.68);
  const colorEmerald = rgb(0.06, 0.65, 0.44);
  const colorBorder = rgb(0.88, 0.91, 0.94);
  const colorLightBg = rgb(0.97, 0.98, 0.99);

  const margin = 32;
  const contentWidth = pageWidth - margin * 2;
  let currentY = pageHeight - margin;

  const curr = safePdfCurrency(data.currency);

  // 1. Top Decorative Brand Bar
  page.drawRectangle({
    x: 0,
    y: pageHeight - 6,
    width: pageWidth,
    height: 6,
    color: colorEmerald,
  });

  // 2. Header: Business Name & Document Title
  currentY -= 20;
  const businessName = safePdfText(data.businessName) || 'Business Receipt';
  page.drawText(businessName, {
    x: margin,
    y: currentY,
    size: 16,
    font: helveticaBold,
    color: colorDark,
  });

  const titleText = 'OFFICIAL RECEIPT';
  const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 10);
  page.drawText(titleText, {
    x: pageWidth - margin - titleWidth,
    y: currentY + 3,
    size: 10,
    font: helveticaBold,
    color: colorEmerald,
  });

  // 3. Store Contact & Address info
  currentY -= 14;
  const businessAddress = safePdfText(data.businessAddress);
  if (businessAddress) {
    page.drawText(businessAddress, {
      x: margin,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorSecondary,
    });
    currentY -= 12;
  }

  const businessPhone = safePdfText(data.businessPhone);
  if (businessPhone) {
    page.drawText(`Contact: ${businessPhone}`, {
      x: margin,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorSecondary,
    });
    currentY -= 12;
  }

  // GST Information (if enabled)
  const gstNum = safePdfText(data.gstNumber).toUpperCase();
  if (data.showGstOnReceipt && gstNum) {
    page.drawText(`GSTIN: ${gstNum}`, {
      x: margin,
      y: currentY,
      size: 8.5,
      font: helveticaBold,
      color: colorDark,
    });
    currentY -= 12;
  }

  // 4. Divider Line
  currentY -= 6;
  page.drawLine({
    start: { x: margin, y: currentY },
    end: { x: pageWidth - margin, y: currentY },
    thickness: 1,
    color: colorBorder,
  });

  // 5. Order & Customer Info Grid
  currentY -= 16;
  // Left: Customer Info
  page.drawText('BILLED TO:', {
    x: margin,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: colorMuted,
  });
  const customerName = safePdfText(data.customerName) || 'Valued Customer';
  page.drawText(customerName, {
    x: margin,
    y: currentY - 12,
    size: 9.5,
    font: helveticaBold,
    color: colorDark,
  });
  if (data.customerPhone) {
    const customerPhone = safePdfText(data.customerPhone);
    page.drawText(`Phone: +${customerPhone}`, {
      x: margin,
      y: currentY - 24,
      size: 8.5,
      font: helvetica,
      color: colorSecondary,
    });
  }

  // Right: Order Number & Date
  const dateFormatted = safePdfText(new Date(data.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }));

  const orderNumStr = `#${safePdfText(data.orderNumber)}`;
  const orderNumWidth = helveticaBold.widthOfTextAtSize(orderNumStr, 9.5);
  page.drawText('RECEIPT NO:', {
    x: pageWidth - margin - 80,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: colorMuted,
  });
  page.drawText(orderNumStr, {
    x: pageWidth - margin - orderNumWidth,
    y: currentY - 12,
    size: 9.5,
    font: helveticaBold,
    color: colorEmerald,
  });

  const dateWidth = helvetica.widthOfTextAtSize(dateFormatted, 8);
  page.drawText(dateFormatted, {
    x: pageWidth - margin - dateWidth,
    y: currentY - 24,
    size: 8,
    font: helvetica,
    color: colorSecondary,
  });

  currentY -= 36;

  // 6. Items Table Header
  page.drawRectangle({
    x: margin,
    y: currentY - 6,
    width: contentWidth,
    height: 18,
    color: colorLightBg,
  });

  page.drawText('ITEM DESCRIPTION', {
    x: margin + 6,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: colorSecondary,
  });

  const qtyX = margin + 200;
  page.drawText('QTY', {
    x: qtyX,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: colorSecondary,
  });

  const priceX = margin + 250;
  page.drawText('PRICE', {
    x: priceX,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: colorSecondary,
  });

  const totalColX = pageWidth - margin - 10;
  const totalHeaderWidth = helveticaBold.widthOfTextAtSize('AMOUNT', 7.5);
  page.drawText('AMOUNT', {
    x: totalColX - totalHeaderWidth,
    y: currentY,
    size: 7.5,
    font: helveticaBold,
    color: colorSecondary,
  });

  currentY -= 14;

  // 7. Item Rows
  data.items.forEach((item) => {
    currentY -= 14;

    // Item Name (truncated if too long)
    const rawName = safePdfText(item.productName) || 'Product';
    const nameMaxLen = 32;
    const displayName = rawName.length > nameMaxLen ? `${rawName.slice(0, nameMaxLen)}...` : rawName;

    page.drawText(displayName, {
      x: margin + 6,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorDark,
    });

    // Qty
    page.drawText(String(item.quantity), {
      x: qtyX,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorDark,
    });

    // Unit Price
    const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
    const unitPriceStr = `${curr}${unitPrice.toFixed(2)}`;
    page.drawText(unitPriceStr, {
      x: priceX,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorSecondary,
    });

    // Line Total
    const lineTotal = typeof item.lineTotal === 'number' ? item.lineTotal : unitPrice * (item.quantity || 1);
    const lineTotalStr = `${curr}${lineTotal.toFixed(2)}`;
    const lineTotalWidth = helveticaBold.widthOfTextAtSize(lineTotalStr, 8.5);
    page.drawText(lineTotalStr, {
      x: totalColX - lineTotalWidth,
      y: currentY,
      size: 8.5,
      font: helveticaBold,
      color: colorDark,
    });

    // Light subtle line between items
    page.drawLine({
      start: { x: margin, y: currentY - 5 },
      end: { x: pageWidth - margin, y: currentY - 5 },
      thickness: 0.5,
      color: rgb(0.93, 0.94, 0.96),
    });
  });

  currentY -= 16;

  // 8. Breakdown & Totals (Right Aligned Box)
  const breakdownLabelX = margin + 180;

  // Subtotal
  page.drawText('Subtotal:', {
    x: breakdownLabelX,
    y: currentY,
    size: 8.5,
    font: helvetica,
    color: colorSecondary,
  });
  const subtotalStr = `${curr}${data.subtotal.toFixed(2)}`;
  const subtotalWidth = helvetica.widthOfTextAtSize(subtotalStr, 8.5);
  page.drawText(subtotalStr, {
    x: totalColX - subtotalWidth,
    y: currentY,
    size: 8.5,
    font: helvetica,
    color: colorDark,
  });
  currentY -= 13;

  // Discount (if any)
  if (data.discount > 0) {
    page.drawText('Discount:', {
      x: breakdownLabelX,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorEmerald,
    });
    const discountStr = `-${curr}${data.discount.toFixed(2)}`;
    const discountWidth = helvetica.widthOfTextAtSize(discountStr, 8.5);
    page.drawText(discountStr, {
      x: totalColX - discountWidth,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorEmerald,
    });
    currentY -= 13;
  }

  // Tax (if any)
  if (data.tax > 0) {
    page.drawText('Tax / VAT:', {
      x: breakdownLabelX,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorSecondary,
    });
    const taxStr = `${curr}${data.tax.toFixed(2)}`;
    const taxWidth = helvetica.widthOfTextAtSize(taxStr, 8.5);
    page.drawText(taxStr, {
      x: totalColX - taxWidth,
      y: currentY,
      size: 8.5,
      font: helvetica,
      color: colorDark,
    });
    currentY -= 13;
  }

  // Total Row Background Box
  currentY -= 4;
  page.drawRectangle({
    x: breakdownLabelX - 8,
    y: currentY - 8,
    width: pageWidth - margin - (breakdownLabelX - 8),
    height: 24,
    color: rgb(0.93, 0.98, 0.95),
    borderColor: rgb(0.8, 0.93, 0.86),
    borderWidth: 1,
  });

  page.drawText('TOTAL PAID:', {
    x: breakdownLabelX,
    y: currentY,
    size: 10,
    font: helveticaBold,
    color: colorEmerald,
  });

  const totalStr = `${curr}${data.totalAmount.toFixed(2)}`;
  const totalWidth = helveticaBold.widthOfTextAtSize(totalStr, 11);
  page.drawText(totalStr, {
    x: totalColX - totalWidth,
    y: currentY,
    size: 11,
    font: helveticaBold,
    color: colorEmerald,
  });

  currentY -= 28;

  // 9. Payment Details
  const paymentLabels: Record<string, string> = {
    CASH: 'Paid via Cash',
    CARD: 'Paid via Card',
    UPI: 'Paid via UPI / QR',
    PAID_CASH: 'Paid via Cash',
    PAID_ONLINE: 'Paid Online / Card / UPI',
    PENDING: 'Payment Pending',
    COD: 'Cash on Delivery',
  };

  const rawPaymentMethod =
    (data.paymentMethod && paymentLabels[data.paymentMethod]) ||
    (data.paymentStatus && paymentLabels[data.paymentStatus]) ||
    'Paid via Cash';
  const paymentMethodStr = safePdfText(rawPaymentMethod);

  page.drawText(`Payment Method: ${paymentMethodStr}`, {
    x: margin,
    y: currentY,
    size: 8.5,
    font: helveticaBold,
    color: colorDark,
  });

  currentY -= 20;

  // 10. Google Review Link Callout (if enabled)
  const googleUrl = safePdfText(data.googleProfileUrl);
  if (data.showGoogleReviewOnReceipt && googleUrl) {
    page.drawRectangle({
      x: margin,
      y: currentY - 14,
      width: contentWidth,
      height: 24,
      color: rgb(0.95, 0.97, 1.0),
      borderColor: rgb(0.82, 0.88, 0.98),
      borderWidth: 1,
    });

    page.drawText('Review us on Google:', {
      x: margin + 8,
      y: currentY - 5,
      size: 8,
      font: helveticaBold,
      color: rgb(0.15, 0.35, 0.75),
    });

    const shortUrl = googleUrl.length > 45 ? `${googleUrl.slice(0, 45)}...` : googleUrl;
    page.drawText(shortUrl, {
      x: margin + 110,
      y: currentY - 5,
      size: 8,
      font: helvetica,
      color: rgb(0.15, 0.35, 0.75),
    });

    currentY -= 30;
  }

  // 11. Footer Thank You
  currentY -= 10;
  const thankYouText = 'Thank you for your order!';
  const thankYouWidth = helveticaBold.widthOfTextAtSize(thankYouText, 9);
  page.drawText(thankYouText, {
    x: (pageWidth - thankYouWidth) / 2,
    y: currentY,
    size: 9,
    font: helveticaBold,
    color: colorDark,
  });

  currentY -= 12;
  const subFooter = 'This is a computer-generated digital receipt powered by Hynox BillDesk.';
  const subFooterWidth = helvetica.widthOfTextAtSize(subFooter, 7);
  page.drawText(subFooter, {
    x: (pageWidth - subFooterWidth) / 2,
    y: currentY,
    size: 7,
    font: helvetica,
    color: colorMuted,
  });

  return doc.save();
}
