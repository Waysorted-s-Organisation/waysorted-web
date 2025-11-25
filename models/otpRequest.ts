import mongoose, { Schema, models, model } from "mongoose";

export interface IOtpRequest {
  requestId: string;
  email: string;
  name?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OtpRequestSchema = new Schema<IOtpRequest>(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Auto-expire documents after expiresAt
OtpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpRequest = models.OtpRequest || model<IOtpRequest>("OtpRequest", OtpRequestSchema);
export default OtpRequest;