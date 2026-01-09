import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Load environment variables simply
const loadEnv = (filePath: string) => {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
            }
        });
    }
};

loadEnv(path.resolve(process.cwd(), '.env'));
loadEnv(path.resolve(process.cwd(), '.env.local'));

const SOURCE_URI = process.env.NEXT_PUBLIC_MONGODB_URI;
const DEST_URI = process.env.NEXT_PUBLIC_MONGODB_URI_TOOLS || process.env.MONGODB_URI_TOOLS;

if (!SOURCE_URI || !DEST_URI) {
    console.error("❌ Missing DB URIs in .env");
    console.error("Source (NEXT_PUBLIC_MONGODB_URI):", SOURCE_URI);
    console.error("Dest (NEXT_PUBLIC_MONGODB_URI_TOOLS):", DEST_URI);
    process.exit(1);
}

// Minimal Schemas
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
});
const SubscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
    createdAt: { type: Date, default: Date.now }
});

async function migrate() {
    console.log("🚀 Starting synchronization...");
    console.log(`📡 Source: ${SOURCE_URI!.split('@')[1] || SOURCE_URI}`); // Hide credentials
    console.log(`📥 Dest:   ${DEST_URI!.split('@')[1] || DEST_URI}`);

    try {
        // 1. Connect to Source (Figma/User DB)
        const sourceConn = await mongoose.createConnection(SOURCE_URI!).asPromise();
        const UserModel = sourceConn.model('User', UserSchema);
        console.log("✅ Connected to Source DB");

        // 2. Connect to Dest (Subscriber DB)
        // 2. Connect to Dest (Subscriber DB) - Force 'waysorted' db
        const destConn = await mongoose.createConnection(DEST_URI!, { dbName: 'waysorted' }).asPromise();
        const SubscriberModel = destConn.model('Subscriber', SubscriberSchema);
        console.log("✅ Connected to Destination DB (waysorted)");

        // 3. Fetch Users
        const users = await UserModel.find({}).lean();
        console.log(`📊 Found ${users.length} users in Source.`);

        // 4. Upsert Subscribers
        let newCount = 0;
        let upCount = 0;

        for (const user of users) {
            if (!user.email) continue;

            const res = await SubscriberModel.updateOne(
                { email: user.email },
                {
                    $set: {
                        name: user.name,
                        email: user.email,
                        status: 'active',
                        source: 'figma-import'
                    },
                    $setOnInsert: { createdAt: new Date() }
                },
                { upsert: true }
            );

            if (res.upsertedCount > 0) newCount++;
            else if (res.modifiedCount > 0) upCount++;
        }

        console.log(`🎉 Sync Complete!`);
        console.log(`   - New Subscribers: ${newCount}`);
        console.log(`   - Updated Subscribers: ${upCount}`);

        // Close connections
        await sourceConn.close();
        await destConn.close();

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

migrate();
