import mongoose from "mongoose";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI_TOOLS;

if (!MONGODB_URI) {
    throw new Error("Please define the NEXT_PUBLIC_MONGODB_URI_TOOLS environment variable");
}

const SlideSchema = new mongoose.Schema({
    toolName: String,
    order: Number,
    image: String,
}, { strict: false });

const Slide = mongoose.models.Slide || mongoose.model("Slide", SlideSchema);

async function check() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB");

        const slides = await Slide.find({ toolName: "frames-to-pdf" }).sort({ order: 1 });
        console.log("---------------------------------------------------");
        slides.forEach(s => {
            console.log(`Order: ${s.order}, Image: ${s.image}`);
        });
        console.log("---------------------------------------------------");

        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

check();
