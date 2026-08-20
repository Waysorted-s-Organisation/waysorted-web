import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export interface IBillingBridgeGrant {
  user: Types.ObjectId;
  codeHash: string;
  productCode?: string | null;
  /**
   * Discount code the plugin's modal showed the customer, carried across the
   * hand-off. Stored on the grant rather than put in the URL the plugin opens,
   * so the code cannot be swapped between the POST and the redirect.
   */
  couponCode?: string | null;
  returnPath: string;
  source?: string | null;
  expiresAt: Date;
  consumedAt?: Date | null;
  createdAt?: Date;
}

type BillingBridgeGrantModel = Model<IBillingBridgeGrant>;

const BillingBridgeGrantSchema = new Schema<IBillingBridgeGrant, BillingBridgeGrantModel>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    codeHash: { type: String, required: true, unique: true, index: true },
    productCode: { type: String, default: null },
    couponCode: { type: String, default: null },
    returnPath: { type: String, required: true, default: "/billing" },
    source: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

BillingBridgeGrantSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BillingBridgeGrant =
  (models.BillingBridgeGrant as BillingBridgeGrantModel) ||
  model<IBillingBridgeGrant, BillingBridgeGrantModel>("BillingBridgeGrant", BillingBridgeGrantSchema);

export default BillingBridgeGrant;
