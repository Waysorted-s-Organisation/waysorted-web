import { Model, Schema, Types, model, models } from "mongoose";
import "./user";

export interface IAttributionCampaign {
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  destinationPath: string;
  active: boolean;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

type AttributionCampaignModel = Model<IAttributionCampaign>;

const AttributionCampaignSchema = new Schema<IAttributionCampaign, AttributionCampaignModel>(
  {
    name: { type: String, required: true, trim: true },
    utmSource: { type: String, required: true, trim: true, index: true },
    utmMedium: { type: String, required: true, trim: true },
    utmCampaign: { type: String, required: true, trim: true },
    destinationPath: { type: String, required: true, trim: true, default: "/payment" },
    active: { type: Boolean, required: true, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true, versionKey: false },
);

AttributionCampaignSchema.index(
  { utmSource: 1, utmCampaign: 1 },
  { unique: true, name: "utmSource_1_utmCampaign_1" },
);

const AttributionCampaign =
  (models.AttributionCampaign as AttributionCampaignModel) ||
  model<IAttributionCampaign, AttributionCampaignModel>(
    "AttributionCampaign",
    AttributionCampaignSchema,
  );

export default AttributionCampaign;
