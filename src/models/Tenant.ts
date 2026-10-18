import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITenant extends Document {
  businessName: string;
  slug: string;
  phone: string;
  currency: string;
  countryCode: string;
  address: string;
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
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    currency: { type: String, default: '$' },
    countryCode: { type: String, default: '1' },
    address: { type: String, default: '' },
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

// Prevent re-compilation of model during HMR
export const Tenant: Model<ITenant> =
  mongoose.models.Tenant || mongoose.model<ITenant>('Tenant', TenantSchema);
