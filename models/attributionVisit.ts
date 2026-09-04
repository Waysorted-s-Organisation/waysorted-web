import { Model, Schema, model, models } from "mongoose";

export interface IAttributionVisit {
  eventId: string;
  visitorId: string;
  utmSource: string;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  landingPath?: string | null;
  clientOpenedAt?: Date | null;
  openedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const AttributionVisitSchema = new Schema<IAttributionVisit>(
  {
    eventId: { type: String, required: true, unique: true, trim: true },
    visitorId: { type: String, required: true, trim: true, index: true },
    utmSource: { type: String, required: true, trim: true },
    utmMedium: { type: String, default: null },
    utmCampaign: { type: String, default: null },
    utmTerm: { type: String, default: null },
    utmContent: { type: String, default: null },
    landingPath: { type: String, default: null },
    clientOpenedAt: { type: Date, default: null },
    openedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true, versionKey: false },
);

AttributionVisitSchema.index(
  { utmSource: 1, utmCampaign: 1, openedAt: -1 },
  { name: "attribution_campaign_openedAt" },
);

const AttributionVisit =
  (models.AttributionVisit as Model<IAttributionVisit>) ||
  model<IAttributionVisit>("AttributionVisit", AttributionVisitSchema);

export default AttributionVisit;
