import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface ReceiptPdfItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  sku?: string;
}

export interface ReceiptPdfData {
  orderNumber: string;
  businessName: string;
  businessType?: string;
  businessAddress?: string;
  businessPhone?: string;
  currency: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: Date | string;
  items: ReceiptPdfItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  taxName?: string;
  isTaxIncluded?: boolean;
  taxType?: string;
  discount: number;
  totalAmount: number;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentReference?: string;
  employee?: string;
  notes?: string;
  gstNumber?: string;
  showGstOnReceipt?: boolean;
  googleProfileUrl?: string;
  showGoogleReviewOnReceipt?: boolean;
}

/**
 * Standard PDF fonts (Courier & Helvetica) only support standard WinAnsi characters.
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
  if (!curr) return '$';
  if (curr.includes('₹') || curr === '₹') return 'Rs.';
  const cleaned = curr.replace(/[^\x20-\x7E\xA0-\xFF]/g, '').trim();
  return cleaned || '$';
}

/**
 * Helper to draw a dashed horizontal line across the receipt
 */
function drawDashedLine(
  page: any,
  x1: number,
  x2: number,
  y: number,
  color: any,
  dashLen = 3,
  gapLen = 2
) {
  for (let x = x1; x < x2; x += dashLen + gapLen) {
    const endX = Math.min(x + dashLen, x2);
    page.drawLine({
      start: { x, y },
      end: { x: endX, y },
      thickness: 0.75,
      color,
    });
  }
}

/**
 * Helper to draw a double line separator (common in thermal POS total bars)
 */
function drawDoubleLine(page: any, x1: number, x2: number, y: number, color: any) {
  page.drawLine({ start: { x: x1, y: y + 1.2 }, end: { x: x2, y: y + 1.2 }, thickness: 0.75, color });
  page.drawLine({ start: { x: x1, y: y - 1.2 }, end: { x: x2, y: y - 1.2 }, thickness: 0.75, color });
}

/**
 * Helper to draw subtle sawtooth / serrated perforation teeth at paper edges
 */
function drawSawtoothPerforation(page: any, width: number, y: number, isTop: boolean, color: any) {
  const toothWidth = 6;
  const toothHeight = 3;
  const numTeeth = Math.ceil(width / toothWidth);

  for (let i = 0; i < numTeeth; i++) {
    const xLeft = i * toothWidth;
    const xMid = xLeft + toothWidth / 2;
    const xRight = xLeft + toothWidth;

    const yBase = y;
    const yPeak = isTop ? y - toothHeight : y + toothHeight;

    page.drawLine({
      start: { x: xLeft, y: yBase },
      end: { x: xMid, y: yPeak },
      thickness: 0.5,
      color,
    });
    page.drawLine({
      start: { x: xMid, y: yPeak },
      end: { x: xRight, y: yBase },
      thickness: 0.5,
      color,
    });
  }
}

/**
 * Generates an authentic thermal POS order receipt PDF
 */
export async function generateReceiptPdf(data: ReceiptPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  // Standard 80mm thermal receipt paper roll width: 280 points (~3.88 inches)
  const pageWidth = 280;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const leftX = margin;
  const rightX = pageWidth - margin;

  // Colors
  const colorBlack = rgb(0.06, 0.06, 0.07); // Thermal carbon black
  const colorSecondary = rgb(0.26, 0.28, 0.32); // Dark charcoal
  const colorMuted = rgb(0.55, 0.58, 0.62); // Faint line / captions
  const colorPaper = rgb(1, 1, 1); // Pure thermal white
  const colorBorder = rgb(0.85, 0.88, 0.90); // Subtle paper edge

  // Fonts
  const courier = await doc.embedFont(StandardFonts.Courier);
  const courierBold = await doc.embedFont(StandardFonts.CourierBold);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const curr = safePdfCurrency(data.currency);

  // 1. Calculate Dynamic Receipt Page Height accurately
  let estimatedHeight = 0;
  // Top padding & sawtooth
  estimatedHeight += 20;

  // Header
  estimatedHeight += 22; // business name
  if (data.businessType) estimatedHeight += 11;
  if (data.businessAddress) estimatedHeight += 11;
  if (data.businessPhone) estimatedHeight += 11;
  if (data.showGstOnReceipt && data.gstNumber) estimatedHeight += 11;

  // Divider
  estimatedHeight += 14;

  // Metadata block (RECEIPT NO, DATE, CUSTOMER, CONTACT, PAYMENT)
  estimatedHeight += 12 * 4;
  if (data.customerPhone) estimatedHeight += 12;
  if (data.employee) estimatedHeight += 12;

  // Divider
  estimatedHeight += 14;

  // Items table header & thin divider
  estimatedHeight += 16;

  // Items rows
  for (const item of data.items) {
    estimatedHeight += 14;
    if (item.sku) estimatedHeight += 9;
    if (safePdfText(item.productName).length > 20) estimatedHeight += 11;
  }

  // Divider
  estimatedHeight += 14;

  // Financial summary (Items count, discount, tax)
  estimatedHeight += 13; // items count / subtotal
  if (data.discount > 0) estimatedHeight += 13;
  if (data.tax > 0) estimatedHeight += 13;

  // Double line + Grand Total + Double line
  estimatedHeight += 38;

  // Payment details (amount paid, mode, txn ref, notes)
  estimatedHeight += 24;
  if (data.paymentReference) estimatedHeight += 12;
  if (data.notes) estimatedHeight += 18;

  // Divider
  estimatedHeight += 14;

  // Barcode & caption
  estimatedHeight += 44;

  // Google review box (if enabled)
  if (data.showGoogleReviewOnReceipt && data.googleProfileUrl) estimatedHeight += 30;

  // Footer thank you & credentials
  estimatedHeight += 38;

  // Bottom padding & sawtooth
  estimatedHeight += 20;

  const pageHeight = Math.max(340, Math.ceil(estimatedHeight));
  const page = doc.addPage([pageWidth, pageHeight]);

  // Background Paper
  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: colorPaper,
  });

  // Subtle thermal paper roll side guides
  page.drawLine({ start: { x: 0, y: 0 }, end: { x: 0, y: pageHeight }, thickness: 0.5, color: colorBorder });
  page.drawLine({ start: { x: pageWidth, y: 0 }, end: { x: pageWidth, y: pageHeight }, thickness: 0.5, color: colorBorder });

  // Top Sawtooth Paper Tear Effect
  drawSawtoothPerforation(page, pageWidth, pageHeight - 1, true, colorBorder);

  let currentY = pageHeight - 16;

  // --------------------------------------------------------------------------
  // SECTION 1: Thermal Receipt Store Header (Centered)
  // --------------------------------------------------------------------------
  const businessName = safePdfText(data.businessName).toUpperCase() || 'RECEIPT';
  const nameSize = businessName.length > 24 ? 12 : 13.5;
  const nameWidth = helveticaBold.widthOfTextAtSize(businessName, nameSize);
  page.drawText(businessName, {
    x: (pageWidth - nameWidth) / 2,
    y: currentY,
    size: nameSize,
    font: helveticaBold,
    color: colorBlack,
  });
  currentY -= 14;

  if (data.businessType) {
    const bTypeStr = safePdfText(data.businessType).toUpperCase();
    const bTypeWidth = courier.widthOfTextAtSize(bTypeStr, 7.5);
    page.drawText(bTypeStr, {
      x: (pageWidth - bTypeWidth) / 2,
      y: currentY,
      size: 7.5,
      font: courier,
      color: colorSecondary,
    });
    currentY -= 11;
  }

  if (data.businessAddress) {
    const addrStr = safePdfText(data.businessAddress);
    const addrWidth = courier.widthOfTextAtSize(addrStr, 7.5);
    // If address is long, center fit or wrap
    if (addrWidth > contentWidth) {
      const shortAddr = `${addrStr.slice(0, 36)}...`;
      const shortW = courier.widthOfTextAtSize(shortAddr, 7.5);
      page.drawText(shortAddr, {
        x: (pageWidth - shortW) / 2,
        y: currentY,
        size: 7.5,
        font: courier,
        color: colorSecondary,
      });
    } else {
      page.drawText(addrStr, {
        x: (pageWidth - addrWidth) / 2,
        y: currentY,
        size: 7.5,
        font: courier,
        color: colorSecondary,
      });
    }
    currentY -= 11;
  }

  if (data.businessPhone) {
    const phoneStr = `TEL: ${safePdfText(data.businessPhone)}`;
    const phoneWidth = courier.widthOfTextAtSize(phoneStr, 7.5);
    page.drawText(phoneStr, {
      x: (pageWidth - phoneWidth) / 2,
      y: currentY,
      size: 7.5,
      font: courier,
      color: colorSecondary,
    });
    currentY -= 11;
  }

  if (data.showGstOnReceipt && data.gstNumber) {
    const gstStr = `GSTIN: ${safePdfText(data.gstNumber).toUpperCase()}`;
    const gstWidth = courierBold.widthOfTextAtSize(gstStr, 7.5);
    page.drawText(gstStr, {
      x: (pageWidth - gstWidth) / 2,
      y: currentY,
      size: 7.5,
      font: courierBold,
      color: colorBlack,
    });
    currentY -= 11;
  }

  // Dashed Separator
  currentY -= 4;
  drawDashedLine(page, leftX, rightX, currentY, colorMuted);
  currentY -= 12;

  // --------------------------------------------------------------------------
  // SECTION 2: Receipt Order Metadata & Customer Details
  // --------------------------------------------------------------------------
  const renderMetaRow = (key: string, val: string, isBold = false) => {
    page.drawText(key, {
      x: leftX,
      y: currentY,
      size: 8,
      font: courier,
      color: colorSecondary,
    });

    const fontToUse = isBold ? courierBold : courier;
    const valWidth = fontToUse.widthOfTextAtSize(val, 8);
    page.drawText(val, {
      x: rightX - valWidth,
      y: currentY,
      size: 8,
      font: fontToUse,
      color: colorBlack,
    });
    currentY -= 12;
  };

  renderMetaRow('RECEIPT NO', `#${safePdfText(data.orderNumber)}`, true);

  const orderDate = new Date(data.createdAt);
  const formattedDate = orderDate.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase();
  const formattedTime = orderDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  renderMetaRow('DATE', `${formattedDate}  ${formattedTime}`);

  const customerName = safePdfText(data.customerName) || 'VALUED CUSTOMER';
  renderMetaRow('CUSTOMER', customerName.toUpperCase());

  if (data.customerPhone) {
    renderMetaRow('CONTACT', `+${safePdfText(data.customerPhone)}`);
  }

  if (data.employee) {
    renderMetaRow('CASHIER', safePdfText(data.employee).toUpperCase());
  }

  const paymentLabels: Record<string, string> = {
    CASH: 'CASH',
    CARD: 'CARD',
    UPI: 'UPI / QR',
    PAID_CASH: 'CASH',
    PAID_ONLINE: 'ONLINE / UPI',
    PENDING: 'PENDING',
    COD: 'CASH ON DELIVERY',
  };
  const payLabel =
    (data.paymentMethod && paymentLabels[data.paymentMethod]) ||
    (data.paymentStatus && paymentLabels[data.paymentStatus]) ||
    'CASH';
  renderMetaRow('PAYMENT', `${payLabel} (PAID)`, true);

  // Dashed Separator
  currentY -= 3;
  drawDashedLine(page, leftX, rightX, currentY, colorMuted);
  currentY -= 12;

  // --------------------------------------------------------------------------
  // SECTION 3: Itemized Table (Authentic POS Monospace Columns)
  // --------------------------------------------------------------------------
  // Header Columns:
  // QTY (left aligned at 16)
  // ITEM (left aligned at 40)
  // PRICE (right aligned at 210)
  // TOTAL (right aligned at 264)
  page.drawText('QTY', { x: leftX, y: currentY, size: 7.5, font: courierBold, color: colorSecondary });
  page.drawText('ITEM DESCRIPTION', { x: leftX + 26, y: currentY, size: 7.5, font: courierBold, color: colorSecondary });

  const priceHeaderWidth = courierBold.widthOfTextAtSize('PRICE', 7.5);
  page.drawText('PRICE', { x: rightX - 52 - priceHeaderWidth, y: currentY, size: 7.5, font: courierBold, color: colorSecondary });

  const totalHeaderWidth = courierBold.widthOfTextAtSize('TOTAL', 7.5);
  page.drawText('TOTAL', { x: rightX - totalHeaderWidth, y: currentY, size: 7.5, font: courierBold, color: colorSecondary });

  currentY -= 5;
  drawDashedLine(page, leftX, rightX, currentY, colorBorder, 2, 2);
  currentY -= 10;

  // Items Body
  for (const item of data.items) {
    const qtyStr = String(item.quantity);
    const unitPrice = typeof item.unitPrice === 'number' ? item.unitPrice : 0;
    const lineTotal = typeof item.lineTotal === 'number' ? item.lineTotal : unitPrice * item.quantity;

    const priceStr = unitPrice.toFixed(2);
    const totalStr = lineTotal.toFixed(2);

    page.drawText(qtyStr, {
      x: leftX,
      y: currentY,
      size: 8,
      font: courier,
      color: colorBlack,
    });

    const rawName = safePdfText(item.productName) || 'Item';
    const maxChars = 20;

    if (rawName.length <= maxChars) {
      page.drawText(rawName, {
        x: leftX + 26,
        y: currentY,
        size: 8,
        font: courierBold,
        color: colorBlack,
      });
    } else {
      // Split into two lines
      const line1 = rawName.slice(0, maxChars);
      const line2 = rawName.slice(maxChars, maxChars * 2);

      page.drawText(line1, {
        x: leftX + 26,
        y: currentY,
        size: 8,
        font: courierBold,
        color: colorBlack,
      });

      currentY -= 9.5;
      page.drawText(line2, {
        x: leftX + 26,
        y: currentY,
        size: 7.5,
        font: courier,
        color: colorSecondary,
      });
    }

    const priceW = courier.widthOfTextAtSize(priceStr, 8);
    page.drawText(priceStr, {
      x: rightX - 52 - priceW,
      y: currentY,
      size: 8,
      font: courier,
      color: colorSecondary,
    });

    const totalW = courierBold.widthOfTextAtSize(totalStr, 8);
    page.drawText(totalStr, {
      x: rightX - totalW,
      y: currentY,
      size: 8,
      font: courierBold,
      color: colorBlack,
    });

    currentY -= 11.5;

    if (item.sku) {
      const skuStr = `[SKU: ${safePdfText(item.sku)}]`;
      page.drawText(skuStr, {
        x: leftX + 26,
        y: currentY,
        size: 6.5,
        font: courier,
        color: colorMuted,
      });
      currentY -= 9;
    }
  }

  // Dashed Separator
  currentY -= 3;
  drawDashedLine(page, leftX, rightX, currentY, colorMuted);
  currentY -= 12;

  // --------------------------------------------------------------------------
  // SECTION 4: Financial Breakdown & Totals (Monospace Receipt Summary)
  // --------------------------------------------------------------------------
  const totalQty = data.items.reduce((acc, i) => acc + (i.quantity || 1), 0);
  const renderTotalRow = (label: string, valueStr: string, isNegative = false) => {
    page.drawText(label, {
      x: leftX,
      y: currentY,
      size: 8,
      font: courier,
      color: colorSecondary,
    });

    const valW = courier.widthOfTextAtSize(valueStr, 8);
    page.drawText(valueStr, {
      x: rightX - valW,
      y: currentY,
      size: 8,
      font: courier,
      color: isNegative ? rgb(0.7, 0.1, 0.1) : colorBlack,
    });
    currentY -= 12;
  };

  renderTotalRow(`TOTAL ITEMS (${totalQty})`, `${curr} ${data.subtotal.toFixed(2)}`);

  if (data.discount > 0) {
    renderTotalRow('DISCOUNT', `-${curr} ${data.discount.toFixed(2)}`, true);
  }

  if (data.tax > 0) {
    if (data.isTaxIncluded) {
      const taxLabel =
        data.taxRate !== undefined && data.taxRate > 0
          ? `${safePdfText(data.taxName || 'GST')} (${data.taxRate}% INCL.)`
          : safePdfText(data.taxName || 'TAX (INCL.)');
      renderTotalRow(taxLabel, `${curr} ${data.tax.toFixed(2)} (INCL)`);
    } else if (data.taxRate !== undefined && data.taxRate > 0 && data.showGstOnReceipt && data.gstNumber) {
      renderTotalRow(`CGST (${(data.taxRate / 2).toFixed(1)}%)`, `${curr} ${(data.tax / 2).toFixed(2)}`);
      renderTotalRow(`SGST (${(data.taxRate / 2).toFixed(1)}%)`, `${curr} ${(data.tax / 2).toFixed(2)}`);
    } else {
      const taxLabel =
        data.taxRate !== undefined && data.taxRate > 0
          ? `${safePdfText(data.taxName || 'GST')} (${data.taxRate}%)`
          : safePdfText(data.taxName || 'TAX / GST');
      renderTotalRow(taxLabel, `${curr} ${data.tax.toFixed(2)}`);
    }
  }

  // Double Line Separator
  currentY -= 2;
  drawDoubleLine(page, leftX, rightX, currentY, colorBlack);
  currentY -= 14;

  // GRAND TOTAL (PROMINENT BOLD THERMAL TEXT)
  page.drawText('TOTAL AMOUNT', {
    x: leftX,
    y: currentY,
    size: 11,
    font: courierBold,
    color: colorBlack,
  });

  const grandTotalStr = `${curr} ${data.totalAmount.toFixed(2)}`;
  const grandTotalW = courierBold.widthOfTextAtSize(grandTotalStr, 11);
  page.drawText(grandTotalStr, {
    x: rightX - grandTotalW,
    y: currentY,
    size: 11,
    font: courierBold,
    color: colorBlack,
  });

  currentY -= 6;
  drawDoubleLine(page, leftX, rightX, currentY, colorBlack);
  currentY -= 14;

  // Payment Confirmation
  renderTotalRow('AMOUNT PAID', `${curr} ${data.totalAmount.toFixed(2)}`);
  renderTotalRow('PAYMENT MODE', payLabel);

  if (data.paymentReference) {
    renderTotalRow('TXN REF', safePdfText(data.paymentReference));
  }

  if (data.notes) {
    const noteStr = `NOTE: ${safePdfText(data.notes)}`;
    page.drawText(noteStr.slice(0, 40), {
      x: leftX,
      y: currentY,
      size: 7.5,
      font: courier,
      color: colorSecondary,
    });
    currentY -= 12;
  }

  // Dashed Separator
  currentY -= 3;
  drawDashedLine(page, leftX, rightX, currentY, colorMuted);
  currentY -= 14;

  // --------------------------------------------------------------------------
  // SECTION 5: Thermal Barcode & Security Stamp
  // --------------------------------------------------------------------------
  // Draw authentic Code 128 / Code 39 style vertical black bars
  const barPattern = [
    2, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 2, 2, 1, 1, 3, 2, 1,
    1, 2, 2, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 1, 3, 2, 2, 1, 1, 2, 3, 1, 2, 1,
    2, 2, 1, 3, 1, 1, 2, 1, 2, 3, 1, 2, 1, 1, 2, 2, 3, 1, 2, 1, 2, 1, 3, 2,
  ];
  const barcodeHeight = 24;
  const barcodeTotalWidth = barPattern.reduce((acc, w) => acc + w + 0.8, 0);
  let bx = (pageWidth - barcodeTotalWidth) / 2;

  for (let i = 0; i < barPattern.length; i++) {
    const barWidth = barPattern[i] * 0.95;
    if (i % 2 === 0) {
      page.drawRectangle({
        x: bx,
        y: currentY - barcodeHeight,
        width: barWidth,
        height: barcodeHeight,
        color: colorBlack,
      });
    }
    bx += barWidth + 0.8;
  }

  currentY -= barcodeHeight + 10;

  // Order Number under Barcode
  const barcodeCaption = `* ${safePdfText(data.orderNumber)} *`;
  const barcodeCapW = courierBold.widthOfTextAtSize(barcodeCaption, 8);
  page.drawText(barcodeCaption, {
    x: (pageWidth - barcodeCapW) / 2,
    y: currentY,
    size: 8,
    font: courierBold,
    color: colorBlack,
  });
  currentY -= 14;

  // --------------------------------------------------------------------------
  // SECTION 6: Google Review Notice (if enabled)
  // --------------------------------------------------------------------------
  if (data.showGoogleReviewOnReceipt && data.googleProfileUrl) {
    const reviewBoxHeight = 22;
    page.drawRectangle({
      x: leftX,
      y: currentY - reviewBoxHeight + 6,
      width: contentWidth,
      height: reviewBoxHeight,
      color: rgb(0.96, 0.98, 0.97),
      borderColor: colorBorder,
      borderWidth: 0.75,
    });

    const revText = 'Enjoyed your experience? Review us on Google!';
    const revW = courier.widthOfTextAtSize(revText, 7);
    page.drawText(revText, {
      x: (pageWidth - revW) / 2,
      y: currentY - 6,
      size: 7,
      font: courier,
      color: colorSecondary,
    });

    currentY -= reviewBoxHeight + 6;
  }

  // --------------------------------------------------------------------------
  // SECTION 7: Thermal Footer & Brand Tagline
  // --------------------------------------------------------------------------
  const thankYou = '*** THANK YOU FOR YOUR VISIT! ***';
  const thankYouW = courierBold.widthOfTextAtSize(thankYou, 8);
  page.drawText(thankYou, {
    x: (pageWidth - thankYouW) / 2,
    y: currentY,
    size: 8,
    font: courierBold,
    color: colorBlack,
  });
  currentY -= 11;

  const retainText = 'Please retain this receipt for your records';
  const retainW = courier.widthOfTextAtSize(retainText, 7);
  page.drawText(retainText, {
    x: (pageWidth - retainW) / 2,
    y: currentY,
    size: 7,
    font: courier,
    color: colorSecondary,
  });
  currentY -= 11;

  const brandText = 'Powered by HYNOX Billing';
  const brandW = courier.widthOfTextAtSize(brandText, 6.5);
  page.drawText(brandText, {
    x: (pageWidth - brandW) / 2,
    y: currentY,
    size: 6.5,
    font: courier,
    color: colorMuted,
  });

  // Bottom Sawtooth Paper Tear Effect
  drawSawtoothPerforation(page, pageWidth, 4, false, colorBorder);

  return doc.save();
}
