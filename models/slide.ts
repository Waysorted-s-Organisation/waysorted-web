import { Schema, model, models } from "mongoose";

const SlideSchema = new Schema({
  toolName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true, // Add index for faster toolName queries
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
}, { timestamps: true });

// Compound index for common query pattern: find by toolName, sort by order
SlideSchema.index({ toolName: 1, order: 1 });

const Slide = models.Slide || model("Slide", SlideSchema);
export default Slide;