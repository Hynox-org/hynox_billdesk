import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
  businessName: string;
  businessType?: string;
  slug: string;
  phone: string;
  currency: string;
  countryCode: string;
  address: string;
  location?: string;
  city?: string;
  province?: string;
  provinceCode?: string;
  zip?: string;
  country?: string;
  defaultEmployee?: string;
  defaultTaxName?: string;
  defaultTaxRate?: number;
  defaultTax2Name?: string;
  deviceId?: string;
  gstNumber?: string;
  showGstOnReceipt?: boolean;
  enableTaxOnCheckout?: boolean;
  googleProfileUrl?: string;
  showGoogleReviewOnReceipt?: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  plan: 'FREE_TRIAL' | 'PRO';
  trialStartsAt: Date;
  trialEndsAt: Date;
  proExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema: Schema<ITenant> = new Schema(
  {
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, default: 'Retail shops', trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    currency: { type: String, default: '$' },
    countryCode: { type: String, default: '1' },
    address: { type: String, default: '' },
    location: { type: String, default: 'Main Store', trim: true },
    city: { type: String, default: '', trim: true },
    province: { type: String, default: '', trim: true },
    provinceCode: { type: String, default: '', trim: true },
    zip: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },
    defaultEmployee: { type: String, default: '', trim: true },
    defaultTaxName: { type: String, default: 'GST 18%', trim: true },
    defaultTaxRate: { type: Number, default: 18 },
    defaultTax2Name: { type: String, default: '', trim: true },
    deviceId: { type: String, default: '', trim: true },
    gstNumber: { type: String, default: '', trim: true },
    showGstOnReceipt: { type: Boolean, default: false },
    enableTaxOnCheckout: { type: Boolean, default: false },
    googleProfileUrl: { type: String, default: '', trim: true },
    showGoogleReviewOnReceipt: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'EXPIRED'],
      default: 'ACTIVE',
    },
    plan: {
      type: String,
      enum: ['FREE_TRIAL', 'PRO'],
      default: 'FREE_TRIAL',
    },
    trialStartsAt: { type: Date, required: true, default: Date.now },
    trialEndsAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // exactly 15 days
    },
    proExpiresAt: { type: Date },
  },
  { timestamps: true }
);

// Refresh model schema during development HMR
if (process.env.NODE_ENV !== 'production' && mongoose.models && mongoose.models.Tenant) {
  delete (mongoose.models as any).Tenant;
}
export const Tenant: Model<ITenant> =
  mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
