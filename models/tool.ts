import { Schema, model, models, HydratedDocument, Model } from "mongoose";

export interface IToolBadge {
  label: string;
  type: "new" | "up next" | "unlock soon";
}

export interface ISlide {
  toolName: string;
  order: number;
  toolID: string;
  title: string;
  subtitle: string;
  bullets: string[];
  image: string;
  imageAlt: string;
}

export interface ITool {
  _id: string | { toString(): string };
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  iconData?: string; // base64 data URL
  isAI: boolean;
  AIIcon?: string; // base64 data URL for AI tools
  badge?: IToolBadge;
  disabled: boolean;
  isActive: boolean;
  category: string;
  tags: string[];
  slides: ISlide[];
  version: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IToolMethods {
  activate(): Promise<void>;
  deactivate(): Promise<void>;
  toggleStatus(): Promise<boolean>;
  addTag(tag: string): Promise<void>;
  removeTag(tag: string): Promise<void>;
  updateBadge(badge: IToolBadge): Promise<void>;
  removeBadge(): Promise<void>;
  addSlide(slide: ISlide): Promise<void>;
  removeSlide(slideIndex: number): Promise<void>;
  updateSlide(slideIndex: number, slide: ISlide): Promise<void>;
  clearSlides(): Promise<void>;
  toPublic(): {
    id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    icon: string;
    iconData?: string; // base64 data URL
    badge?: IToolBadge;
    disabled: boolean;
    isActive: boolean;
    category: string;
    tags: string[];
    slides: ISlide[];
    version: string;
  };
}

export interface IToolStatics {
  findBySlug(slug: string): Promise<HydratedDocument<ITool, IToolMethods> | null>;
  findByCategory(category: string): Promise<HydratedDocument<ITool, IToolMethods>[]>;
  findActive(): Promise<HydratedDocument<ITool, IToolMethods>[]>;
  findByTag(tag: string): Promise<HydratedDocument<ITool, IToolMethods>[]>;
  search(query: string): Promise<HydratedDocument<ITool, IToolMethods>[]>;
}

// IMPORTANT: extend Model with instance methods, then merge statics
export interface ToolModel extends Model<ITool, {}, IToolMethods>, IToolStatics {}

const ToolBadgeSchema = new Schema<IToolBadge>(
  {
    label: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["new", "up next", "unlock soon"],
    },
  },
  { _id: false }
);

const SlideSchema = new Schema<ISlide>(
  {
    toolName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    toolID: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    subtitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    bullets: [
      {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
      },
    ],
    image: {
      type: String,
      required: true,
      match: /\.(svg|png|jpg|jpeg)$/i,
    },
    imageAlt: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false }
);

// Note generics: <Doc, ModelType, InstanceMethods, QueryHelpers={}, Statics=...>
const ToolSchema = new Schema<ITool, ToolModel, IToolMethods, {}, IToolStatics>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    icon: {
      type: String,
      required: true,
      match: /\.(svg|png|jpg|jpeg)$/i,
    },
    iconData: {
      type: String,
      required: false,
      match: /^data:image\/(png|jpg|jpeg|svg\+xml);base64,[A-Za-z0-9+/=]+$/,
    },
    badge: ToolBadgeSchema,
    disabled: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    slides: [SlideSchema],
    version: {
      type: String,
      default: "1.0.0",
      match: /^\d+\.\d+\.\d+$/,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: any) => {
        if (ret && ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        return ret;
      },
    },
  }
);

// Indexes
ToolSchema.index({ category: 1 });
ToolSchema.index({ isActive: 1 });
ToolSchema.index({ disabled: 1 });
ToolSchema.index({ tags: 1 });
ToolSchema.index({ name: "text", description: "text" });

// Instance methods
ToolSchema.methods.activate = async function () {
  this.isActive = true;
  await this.save();
};

ToolSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
};

ToolSchema.methods.toggleStatus = async function () {
  this.isActive = !this.isActive;
  await this.save();
  return this.isActive;
};

ToolSchema.methods.addTag = async function (tag: string) {
  const normalizedTag = tag.toLowerCase().trim();
  if (!this.tags.includes(normalizedTag)) {
    this.tags.push(normalizedTag);
    await this.save();
  }
};

ToolSchema.methods.removeTag = async function (tag: string) {
  const normalizedTag = tag.toLowerCase().trim();
  if (this.tags.includes(normalizedTag)) {
    this.tags = this.tags.filter((t) => t !== normalizedTag);
    await this.save();
  }
};

ToolSchema.methods.updateBadge = async function (badge: IToolBadge) {
  this.badge = badge;
  await this.save();
};

ToolSchema.methods.removeBadge = async function () {
  this.badge = undefined;
  await this.save();
};

ToolSchema.methods.addSlide = async function (slide: ISlide) {
  this.slides.push(slide);
  await this.save();
};

ToolSchema.methods.removeSlide = async function (slideIndex: number) {
  if (slideIndex >= 0 && slideIndex < this.slides.length) {
    this.slides.splice(slideIndex, 1);
    await this.save();
  }
};

ToolSchema.methods.updateSlide = async function (slideIndex: number, slide: ISlide) {
  if (slideIndex >= 0 && slideIndex < this.slides.length) {
    this.slides[slideIndex] = slide;
    await this.save();
  }
};

ToolSchema.methods.clearSlides = async function () {
  this.slides = [];
  await this.save();
};

ToolSchema.methods.toPublic = function () {
  return {
    id: this._id.toString(),
    name: this.name,
    slug: this.slug,
    description: this.description,
    shortDescription: this.shortDescription,
    icon: this.icon,
    badge: this.badge,
    disabled: this.disabled,
    isActive: this.isActive,
    category: this.category,
    tags: this.tags,
    slides: this.slides,
    version: this.version,
  };
};

// Static methods
ToolSchema.statics.findBySlug = async function (slug: string) {
  return await this.findOne({ slug: slug.toLowerCase() });
};

ToolSchema.statics.findByCategory = async function (category: string) {
  return await this.find({
    category: category.toLowerCase(),
    isActive: true,
  }).sort({ name: 1 });
};

ToolSchema.statics.findActive = async function () {
  return await this.find({
    isActive: true,
    disabled: false,
  }).sort({ name: 1 });
};

ToolSchema.statics.findByTag = async function (tag: string) {
  return await this.find({
    tags: tag.toLowerCase(),
    isActive: true,
  }).sort({ name: 1 });
};

ToolSchema.statics.search = async function (query: string) {
  return await this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { tags: { $regex: query, $options: "i" } },
        ],
      },
    ],
  }).sort({ name: 1 });
};

// Pre-save middleware
ToolSchema.pre("save", function (next) {
  if (this.isNew && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  if (this.tags && this.tags.length > 0) {
    this.tags = this.tags.map((tag) => tag.toLowerCase().trim());
    this.tags = [...new Set(this.tags)];
  }

  next();
});

const Tool = (models.Tool as ToolModel) || model<ITool, ToolModel>("Tool", ToolSchema);
export default Tool;