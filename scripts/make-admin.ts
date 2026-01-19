
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const MONGODB_URI =
    process.env.MONGODB_URI_TOOLS ||
    process.env.NEXT_PUBLIC_MONGODB_URI_TOOLS ||
    process.env.MONGODB_URI ||
    process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI not set in environment variables.");
    process.exit(1);
}

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    role: { type: String, default: "user" },
}, { strict: false }); // Strict false to allow other fields to exist without defining them

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function makeAdmin(email: string) {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log("Connected to MongoDB");

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.role = "admin";
        await user.save();

        console.log(`Successfully promoted ${email} to admin.`);
    } catch (error) {
        console.error("Error making user admin:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address.");
    console.log("Usage: npm run make-admin <email>");
    process.exit(1);
}

makeAdmin(email);
