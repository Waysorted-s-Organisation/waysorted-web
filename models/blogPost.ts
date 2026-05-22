import { Schema, model, models, type Document, type Model } from "mongoose";
import { buildTableOfContents, normalizeContentBlocks, slugifyBlogText } from "@/lib/blogs";
import type { BlogContentBlock, BlogPostCard, BlogPostDetail, BlogPostStatus } from "@/types/blog";

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  readTime: string;
  authorName: string;
  authorAvatar?: string;
  coverImage: string;
  coverImageAlt: string;
  status: BlogPostStatus;
  publishedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  contentBlocks: BlogContentBlock[];
  createdAt: Date;
  updatedAt: Date;
}

type BlogPostSerialized = BlogPostCard | BlogPostDetail;

function dateToString(date?: Date) {
  return date ? date.toISOString() : undefined;
}

function serializeBlogPost(doc: IBlogPost, includeContent = false): BlogPostSerialized {
  const blocks = normalizeContentBlocks(doc.contentBlocks);
  const base: BlogPostCard = {
    id: doc._id.toString(),
    title: doc.title,
    slug: doc.slug,
    excerpt: doc.excerpt,
    category: doc.category,
    tags: doc.tags || [],
    readTime: doc.readTime,
    authorName: doc.authorName,
    authorAvatar: doc.authorAvatar,
    coverImage: doc.coverImage,
    coverImageAlt: doc.coverImageAlt,
    status: doc.status,
    publishedAt: dateToString(doc.publishedAt),
    createdAt: dateToString(doc.createdAt),
    updatedAt: dateToString(doc.updatedAt),
  };

  if (!includeContent) return base;

  return {
    ...base,
    contentBlocks: blocks,
    tableOfContents: buildTableOfContents(blocks),
  };
}

export interface IBlogPostMethods {
  toCard(): BlogPostCard;
  toDetail(): BlogPostDetail;
}

export type BlogPostModel = Model<IBlogPost, object, IBlogPostMethods>;

const BlogContentBlockSchema = new Schema<BlogContentBlock>(
  {
    type: {
      type: String,
      required: true,
      enum: ["heading", "paragraph", "image", "quote", "list"],
    },
    level: { type: Number, enum: [2, 3] },
    text: { type: String, trim: true },
    anchor: { type: String, trim: true },
    src: { type: String, trim: true },
    alt: { type: String, trim: true },
    caption: { type: String, trim: true },
    attribution: { type: String, trim: true },
    style: { type: String, enum: ["bullet", "numbered"] },
    items: { type: [String], default: undefined },
  },
  { _id: false }
);

const BlogPostSchema = new Schema<IBlogPost, BlogPostModel, IBlogPostMethods>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: /^[a-z0-9-]+$/,
    },
    excerpt: { type: String, required: true, trim: true, maxlength: 500 },
    category: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    readTime: { type: String, required: true, trim: true, default: "4 min read" },
    authorName: { type: String, required: true, trim: true, default: "Waysorted" },
    authorAvatar: { type: String, trim: true },
    coverImage: { type: String, required: true, trim: true },
    coverImageAlt: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: String },
    contentBlocks: { type: [BlogContentBlockSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

BlogPostSchema.index({ status: 1, isDeleted: 1, publishedAt: -1 });
BlogPostSchema.index({ category: 1, status: 1, isDeleted: 1 });
BlogPostSchema.index({ tags: 1 });
BlogPostSchema.index({ title: "text", excerpt: "text", tags: "text", category: "text" });

BlogPostSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = slugifyBlogText(this.title);
  }
  this.tags = (this.tags || []).map((tag) => tag.trim()).filter(Boolean);
  this.contentBlocks = normalizeContentBlocks(this.contentBlocks);
  next();
});

BlogPostSchema.methods.toCard = function () {
  return serializeBlogPost(this, false) as BlogPostCard;
};

BlogPostSchema.methods.toDetail = function () {
  return serializeBlogPost(this, true) as BlogPostDetail;
};

const BlogPost =
  (models.BlogPost as BlogPostModel) ||
  model<IBlogPost, BlogPostModel>("BlogPost", BlogPostSchema);

export default BlogPost;
