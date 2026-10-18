import mongoose, { Schema, Document, Model } from 'mongoose';

export type OtpType = 'REGISTER' | 'RESET_PASSWORD' | 'FORGOT_PASSWORD';

export interface IOtp extends Document {
  email: string;
  otp: string;
  type: OtpType;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['REGISTER', 'RESET_PASSWORD', 'FORGOT_PASSWORD'],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup on expiration
    },
  },
  { timestamps: true }
);

// Compound index for quick lookups
OtpSchema.index({ email: 1, type: 1 });

export const Otp: Model<IOtp> =
  mongoose.models.Otp || mongoose.model<IOtp>('Otp', OtpSchema);
