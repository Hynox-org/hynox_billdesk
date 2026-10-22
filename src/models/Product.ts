import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  tenantId: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  isAvailable: boolean;
  trackStock: boolean;
  stockQuantity: number;
  imageUrl?: string;
  requiresShipping?: boolean;
  taxable?: boolean;
  vendor?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: '', trim: true },
    isAvailable: { type: Boolean, default: true },
    trackStock: { type: Boolean, default: false },
    stockQuantity: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: '' },
    requiresShipping: { type: Boolean, default: false },
    taxable: { type: Boolean, default: true },
    vendor: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

ProductSchema.index({ tenantId: 1, name: 1 });
ProductSchema.index({ tenantId: 1, createdAt: -1 });
ProductSchema.index({ tenantId: 1, isAvailable: 1 });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
