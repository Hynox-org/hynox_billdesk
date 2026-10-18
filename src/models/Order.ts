import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId?: mongoose.Types.ObjectId;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface IOrder extends Document {
  tenantId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentStatus: 'PAID_CASH' | 'PAID_ONLINE' | 'PENDING' | 'COD' | 'PAID';
  whatsappStatus: 'GENERATED' | 'SENT';
  notes?: string;
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
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: '$' },
    paymentStatus: {
      type: String,
      enum: ['PAID_CASH', 'PAID_ONLINE', 'PENDING', 'COD', 'PAID'],
      default: 'PAID_CASH',
    },
    whatsappStatus: {
      type: String,
      enum: ['GENERATED', 'SENT'],
      default: 'GENERATED',
    },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

OrderSchema.index({ tenantId: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, orderNumber: 1 });

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
