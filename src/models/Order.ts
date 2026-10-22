import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  compareAtPrice?: number;
  sku?: string;
  requiresShipping?: boolean;
  taxable?: boolean;
  fulfillmentStatus?: string;
  discount?: number;
  vendor?: string;
}

export interface IOrder extends Document {
  tenantId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  acceptsMarketing?: boolean;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  taxRate?: number;
  taxName?: string;
  taxType?: 'INCLUDED' | 'EXCLUDED';
  isTaxIncluded?: boolean;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'PAID_CASH' | 'PAID_ONLINE' | 'PENDING' | 'COD' | 'PAID';
  paymentMethod?: string;
  whatsappStatus: 'GENERATED' | 'SENT';
  notes?: string;
  noteAttributes?: string;
  financialStatus?: string;
  paidAt?: Date;
  fulfillmentStatus?: string;
  fulfilledAt?: Date;
  cancelledAt?: Date;
  shippingMethod?: string;
  shippingCost?: number;
  discountCode?: string;
  refundedAmount?: number;
  outstandingBalance?: number;
  vendor?: string;
  businessType?: string;
  employee?: string;
  location?: string;
  deviceId?: string;
  tags?: string;
  riskLevel?: string;
  source?: string;
  receiptNumber?: string;
  paymentReference?: string;
  paymentId?: string;
  paymentTermsName?: string;
  nextPaymentDueAt?: Date;
  paymentReferences?: string;
  duties?: number;
  // Billing Address
  billingName?: string;
  billingStreet?: string;
  billingAddress1?: string;
  billingAddress2?: string;
  billingCompany?: string;
  billingCity?: string;
  billingZip?: string;
  billingProvince?: string;
  billingProvinceName?: string;
  billingCountry?: string;
  billingPhone?: string;
  // Shipping Address
  shippingName?: string;
  shippingStreet?: string;
  shippingAddress1?: string;
  shippingAddress2?: string;
  shippingCompany?: string;
  shippingCity?: string;
  shippingZip?: string;
  shippingProvince?: string;
  shippingProvinceName?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  // Tax breakdown
  tax1Name?: string;
  tax1Value?: number;
  tax2Name?: string;
  tax2Value?: number;
  tax3Name?: string;
  tax3Value?: number;
  tax4Name?: string;
  tax4Value?: number;
  tax5Name?: string;
  tax5Value?: number;
  gstNumber?: string;
  googleProfileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
    compareAtPrice: { type: Number, default: 0 },
    sku: { type: String, default: '', trim: true },
    requiresShipping: { type: Boolean, default: false },
    taxable: { type: Boolean, default: true },
    fulfillmentStatus: { type: String, default: 'fulfilled' },
    discount: { type: Number, default: 0 },
    vendor: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderNumber: { type: String, required: true },
    customerName: { type: String, default: 'Valued Customer', trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: '', trim: true },
    acceptsMarketing: { type: Boolean, default: false },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxName: { type: String, default: '', trim: true },
    taxType: { type: String, enum: ['INCLUDED', 'EXCLUDED'], default: 'EXCLUDED' },
    isTaxIncluded: { type: Boolean, default: false },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: '$' },
    paymentStatus: {
      type: String,
      enum: ['PAID_CASH', 'PAID_ONLINE', 'PENDING', 'COD', 'PAID'],
      default: 'PAID_CASH',
    },
    paymentMethod: { type: String, default: 'CASH' },
    whatsappStatus: {
      type: String,
      enum: ['GENERATED', 'SENT'],
      default: 'GENERATED',
    },
    notes: { type: String, default: '' },
    noteAttributes: { type: String, default: '' },
    financialStatus: { type: String, default: 'paid' },
    paidAt: { type: Date },
    fulfillmentStatus: { type: String, default: 'fulfilled' },
    fulfilledAt: { type: Date },
    cancelledAt: { type: Date },
    shippingMethod: { type: String, default: 'POS' },
    shippingCost: { type: Number, default: 0 },
    discountCode: { type: String, default: '' },
    refundedAmount: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    vendor: { type: String, default: '' },
    businessType: { type: String, default: '' },
    employee: { type: String, default: '' },
    location: { type: String, default: 'Main Store' },
    deviceId: { type: String, default: '' },
    tags: { type: String, default: 'POS' },
    riskLevel: { type: String, default: 'Low' },
    source: { type: String, default: 'POS' },
    receiptNumber: { type: String, default: '' },
    paymentReference: { type: String, default: '' },
    paymentId: { type: String, default: '' },
    paymentTermsName: { type: String, default: '' },
    nextPaymentDueAt: { type: Date },
    paymentReferences: { type: String, default: '' },
    duties: { type: Number, default: 0 },
    billingName: { type: String, default: '' },
    billingStreet: { type: String, default: '' },
    billingAddress1: { type: String, default: '' },
    billingAddress2: { type: String, default: '' },
    billingCompany: { type: String, default: '' },
    billingCity: { type: String, default: '' },
    billingZip: { type: String, default: '' },
    billingProvince: { type: String, default: '' },
    billingProvinceName: { type: String, default: '' },
    billingCountry: { type: String, default: '' },
    billingPhone: { type: String, default: '' },
    shippingName: { type: String, default: '' },
    shippingStreet: { type: String, default: '' },
    shippingAddress1: { type: String, default: '' },
    shippingAddress2: { type: String, default: '' },
    shippingCompany: { type: String, default: '' },
    shippingCity: { type: String, default: '' },
    shippingZip: { type: String, default: '' },
    shippingProvince: { type: String, default: '' },
    shippingProvinceName: { type: String, default: '' },
    shippingCountry: { type: String, default: '' },
    shippingPhone: { type: String, default: '' },
    tax1Name: { type: String, default: '' },
    tax1Value: { type: Number, default: 0 },
    tax2Name: { type: String, default: '' },
    tax2Value: { type: Number, default: 0 },
    tax3Name: { type: String, default: '' },
    tax3Value: { type: Number, default: 0 },
    tax4Name: { type: String, default: '' },
    tax4Value: { type: Number, default: 0 },
    tax5Name: { type: String, default: '' },
    tax5Value: { type: Number, default: 0 },
    gstNumber: { type: String, default: '' },
    googleProfileUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, orderNumber: 1 });
OrderSchema.index({ orderNumber: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models && mongoose.models.Order) {
  delete (mongoose.models as any).Order;
}
export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
