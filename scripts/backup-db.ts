import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const MONGO_URI = process.env.NEXT_PUBLIC_MONGODB_URI_TOOLS || process.env.MONGODB_URI_TOOLS;

if (!MONGO_URI) {
    console.error('Error: No MongoDB URI found. Set NEXT_PUBLIC_MONGODB_URI_TOOLS in .env');
    process.exit(1);
}

// Minimal Schemas for backup
const ToolSchema = new mongoose.Schema({}, { strict: false, collection: 'tools' });
const SlideSchema = new mongoose.Schema({}, { strict: false, collection: 'slides' });

async function backup() {
    console.log('🚀 Starting Database Backup...');

    try {
        const conn = await mongoose.connect(MONGO_URI!, { dbName: 'waysorted' });
        console.log('✅ Connected to MongoDB');

        const ToolModel = conn.model('Tool', ToolSchema);
        const SlideModel = conn.model('Slide', SlideSchema);

        const tools = await ToolModel.find({}).lean();
        const slides = await SlideModel.find({}).lean();

        console.log(`📊 Found ${tools.length} tools and ${slides.length} slides.`);

        const backupDir = path.resolve(process.cwd(), 'backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

        const backupData = {
            timestamp: new Date().toISOString(),
            tools,
            slides
        };

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

        // Also keep a "latest" version
        const latestPath = path.join(backupDir, 'latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2));

        console.log(`💾 Backup saved to ${backupPath}`);
        console.log(`✨ "latest.json" updated.`);

        await mongoose.disconnect();
        console.log('✅ Disconnected');
    } catch (error) {
        console.error('❌ Backup failed:', error);
        process.exit(1);
    }
}

backup();
