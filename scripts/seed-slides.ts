/**
 * Seed script to restore learning tools and slides to MongoDB
 * Run with: npx tsx scripts/seed-slides.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ============================================================================
// SCHEMAS
// ============================================================================

// Slide Schema (separate collection)
const SlideSchema = new mongoose.Schema({
    toolName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        index: true,
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

SlideSchema.index({ toolName: 1, order: 1 });

// Tool Badge Schema
const ToolBadgeSchema = new mongoose.Schema({
    label: { type: String, required: true },
    type: {
        type: String,
        required: true,
        enum: ["new", "up next", "unlock soon"],
    },
}, { _id: false });

// Embedded Slide Schema for Tool
const EmbeddedSlideSchema = new mongoose.Schema({
    toolName: { type: String, required: true, trim: true, maxlength: 100 },
    order: { type: Number, required: true, min: 1 },
    toolID: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, required: true, trim: true, maxlength: 500 },
    bullets: [{ type: String, required: true, trim: true, maxlength: 200 }],
    image: { type: String, required: true, match: /\.(svg|png|jpg|jpeg)$/i },
    imageAlt: { type: String, required: true, trim: true, maxlength: 100 },
}, { _id: false });

// Tool Schema
const ToolSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^[a-z0-9-]+$/ },
    heading: { type: String, required: true },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    shortDescription: { type: String, required: true, trim: true, maxlength: 200 },
    icon: { type: String, required: true, match: /\.(svg|png|jpg|jpeg)$/i },
    iconData: { type: String, required: false },
    isAI: { type: Boolean, default: false },
    AIIcon: { type: String, required: false },
    badge: ToolBadgeSchema,
    disabled: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    category: { type: String, required: true, trim: true, lowercase: true },
    tagline: { type: String, required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    slides: [EmbeddedSlideSchema],
    version: { type: String, default: "1.0.0", match: /^\d+\.\d+\.\d+$/ },
}, { timestamps: true, versionKey: false });

const Slide = mongoose.models.Slide || mongoose.model('Slide', SlideSchema);
const Tool = mongoose.models.Tool || mongoose.model('Tool', ToolSchema);

// ============================================================================
// TOOL DATA
// ============================================================================
const toolsData = [
    {
        name: 'Palettable',
        slug: 'palettable',
        heading: 'Generate beautiful color palettes with instant contrast checking',
        description: 'Create color palettes with variations and accessibility checks. Test contrast ratios, generate complementary colors, and export palettes for your design system.',
        shortDescription: 'Create color palettes with variations and accessibility checks.',
        icon: '/icons/palettable.svg',
        isAI: false,
        badge: { label: 'New', type: 'new' as const },
        disabled: false,
        isActive: true,
        category: 'color',
        tagline: 'Generate beautiful color palettes with instant contrast checking.',
        tags: ['color', 'palette', 'accessibility', 'contrast', 'wcag'],
        slides: [],
        version: '1.0.0',
    },
    {
        name: 'Frames to PDF',
        slug: 'frames-to-pdf',
        heading: 'Export Figma frames to high-quality PDF with zero latency',
        description: 'Export your Figma frames to high-quality PDF documents. Reorder, merge, compress, and add password protection.',
        shortDescription: 'Turn your designs into share-ready PDFs in seconds.',
        icon: '/icons/frames-to-pdf.svg',
        isAI: false,
        badge: { label: 'New', type: 'new' as const },
        disabled: false,
        isActive: true,
        category: 'export',
        tagline: 'Export Figma frames to high-quality PDF with zero latency.',
        tags: ['pdf', 'export', 'print', 'document', 'frames'],
        slides: [],
        version: '1.0.0',
    },
    {
        name: 'Unit Converter',
        slug: 'unit-converter',
        heading: 'Convert between design units instantly',
        description: 'Convert between pixels, centimeters, inches, and more. Set DPI, add bleed marks, and save custom presets.',
        shortDescription: 'Effortlessly convert design dimensions between units.',
        icon: '/icons/unit-converter.svg',
        isAI: false,
        badge: { label: 'New', type: 'new' as const },
        disabled: false,
        isActive: true,
        category: 'utility',
        tagline: 'Convert between design units instantly.',
        tags: ['units', 'converter', 'pixels', 'print', 'dpi', 'bleed'],
        slides: [],
        version: '1.0.0',
    },
    {
        name: 'File Importer',
        slug: 'file-importer',
        heading: 'Fast asset import into Figma with smart detection',
        description: 'Import external design files with automatic content detection, font mapping, and compatibility checks.',
        shortDescription: 'Import files effortlessly with smart font handling and previews.',
        icon: '/icons/file-importer.svg',
        isAI: false,
        badge: { label: 'New', type: 'new' as const },
        disabled: false,
        isActive: true,
        category: 'import',
        tagline: 'Fast asset import into Figma with smart detection.',
        tags: ['import', 'files', 'fonts', 'gpx', 'vector'],
        slides: [],
        version: '1.0.0',
    },
];

// ============================================================================
// PALETTABLE SLIDES (5 slides)
// ============================================================================
const palettableSlides = [
    {
        toolName: 'palettable',
        order: 1,
        toolID: 'palettable',
        title: 'Selecting Colors',
        subtitle: 'Pick Your Color',
        bullets: [
            'Choose colors via HEX, RGB, or HSL.',
            'Or copy color code from shapes in file.',
            'Instantly preview shades and swatches.',
        ],
        image: '/images/palettable-brief-1.svg',
        imageAlt: 'Palettable color selection interface',
    },
    {
        toolName: 'palettable',
        order: 2,
        toolID: 'palettable',
        title: 'Color Variations',
        subtitle: 'Play with Variations',
        bullets: [
            'Adjust brightness, darkness, saturation, monochrome and hue.',
            'Generate multiple steps for smooth gradients.',
            'Perfect for UI states, themes, or highlights.',
        ],
        image: '/images/palettable-brief-2.svg',
        imageAlt: 'Color variations panel showing brightness and saturation controls',
    },
    {
        toolName: 'palettable',
        order: 3,
        toolID: 'palettable',
        title: 'Color Schemes',
        subtitle: 'Generate Smart Schemes',
        bullets: [
            'Explore Analogous, and Complementary palettes.',
            'Quickly build consistent themes.',
            'Check Complementary schemes for instant use.',
        ],
        image: '/images/palettable-brief-3.svg',
        imageAlt: 'Color schemes panel with complementary and analogous options',
    },
    {
        toolName: 'palettable',
        order: 4,
        toolID: 'palettable',
        title: 'Color Contrast & Accessibility',
        subtitle: 'Check Contrast level',
        bullets: [
            'Test your color pairs against WCAG & APCA standards.',
            'Get compliance scores for normal and large text.',
            'Run blindness checks.',
        ],
        image: '/images/palettable-brief-4.svg',
        imageAlt: 'Accessibility panel showing WCAG contrast checks',
    },
    {
        toolName: 'palettable',
        order: 5,
        toolID: 'palettable',
        title: 'Export & Apply',
        subtitle: 'Take Your Palette Anywhere',
        bullets: [
            'Export single colors or full palettes.',
            'Integrate with your design system instantly.',
            'Save time, keep consistency, and design faster.',
        ],
        image: '/images/palettable-brief-5.svg',
        imageAlt: 'Export options for colors and palettes',
    },
];

// ============================================================================
// PDF EXPORTER / FRAMES TO PDF SLIDES (8 slides)
// ============================================================================
const framesToPdfSlides = [
    {
        toolName: 'frames-to-pdf',
        order: 1,
        toolID: 'frames-to-pdf',
        title: 'Reorder & Merge Frames',
        subtitle: 'Organize Your Frames',
        bullets: [
            'Drag and drop frames to reorder them.',
            'Select multiple frames to merge into a single PDF.',
            'Easily manage the order for multi-page documents.',
            'Perfect for presentations and portfolios.',
        ],
        image: '/images/frames-to-pdf/1.png',
        imageAlt: 'Reorder and merge frames interface',
    },
    {
        toolName: 'frames-to-pdf',
        order: 2,
        toolID: 'frames-to-pdf',
        title: 'Group merge',
        subtitle: 'Merge by Groups',
        bullets: [
            'Group frames by naming conventions.',
            'Merge entire groups into separate PDFs.',
            'Keep your exports organized automatically.',
            'Save time on bulk exports.',
        ],
        image: '/images/frames-to-pdf/2.png',
        imageAlt: 'Group merge options panel',
    },
    {
        toolName: 'frames-to-pdf',
        order: 3,
        toolID: 'frames-to-pdf',
        title: 'Preview Section',
        subtitle: 'Preview Before Export',
        bullets: [
            'See exactly how your PDF will look.',
            'Navigate through pages in preview.',
            'Catch issues before final export.',
            'Zoom in for detail inspection.',
        ],
        image: '/images/frames-to-pdf/3.png',
        imageAlt: 'Preview section showing PDF pages',
    },
    {
        toolName: 'frames-to-pdf',
        order: 4,
        toolID: 'frames-to-pdf',
        title: 'Change DPI',
        subtitle: 'Control Export Quality',
        bullets: [
            'Set custom DPI for your exports.',
            'Choose 72 DPI for web or 300 DPI for print.',
            'Balance quality with file size.',
            'Get crisp exports every time.',
        ],
        image: '/images/frames-to-pdf/4.png',
        imageAlt: 'DPI settings panel',
    },
    {
        toolName: 'frames-to-pdf',
        order: 5,
        toolID: 'frames-to-pdf',
        title: 'Compress PDF',
        subtitle: 'Reduce File Size',
        bullets: [
            'Compress PDFs without quality loss.',
            'Choose compression level.',
            'Perfect for email attachments.',
            'Save storage space.',
        ],
        image: '/images/frames-to-pdf/5.png',
        imageAlt: 'PDF compression settings',
    },
    {
        toolName: 'frames-to-pdf',
        order: 6,
        toolID: 'frames-to-pdf',
        title: 'Password Encryption',
        subtitle: 'Secure Your PDFs',
        bullets: [
            'Add password protection to PDFs.',
            'Set different passwords for viewing and editing.',
            'Keep sensitive documents secure.',
            'Industry-standard encryption.',
        ],
        image: '/images/frames-to-pdf/6.png',
        imageAlt: 'Password encryption settings',
    },
    {
        toolName: 'frames-to-pdf',
        order: 7,
        toolID: 'frames-to-pdf',
        title: 'Color Mode',
        subtitle: 'Perfect Color Output',
        bullets: [
            'Switch between RGB and CMYK.',
            'Optimize for screen or print.',
            'Maintain color accuracy.',
            'Professional-grade output.',
        ],
        image: '/images/frames-to-pdf/7.png',
        imageAlt: 'Color mode selection panel',
    },
    {
        toolName: 'frames-to-pdf',
        order: 8,
        toolID: 'frames-to-pdf',
        title: 'Export',
        subtitle: 'Download Your PDF',
        bullets: [
            'Export with all your settings applied.',
            'Download instantly to your device.',
            'Share directly from the plugin.',
            'Keep your workflow fast and simple.',
        ],
        image: '/images/frames-to-pdf/8.png',
        imageAlt: 'Export and download options',
    },
];

// ============================================================================
// UNIT CONVERTER SLIDES (7 slides)
// ============================================================================
const unitConverterSlides = [
    {
        toolName: 'unit-converter',
        order: 1,
        toolID: 'unit-converter',
        title: 'Convert units into pixels',
        subtitle: 'The Unit Converter tool helps you convert different measurement units to pixels.',
        bullets: [
            'Easily convert cm/mm/in/pt units into pixels.',
            'Get instant size at different DPI values.',
        ],
        image: '/images/unit-converter-brief-1.svg',
        imageAlt: 'Unit conversion interface showing cm to pixels',
    },
    {
        toolName: 'unit-converter',
        order: 2,
        toolID: 'unit-converter',
        title: 'Change Units',
        subtitle: 'Allows you to switch between different measurement unit systems, ensuring your design matches the format best for your work.',
        bullets: [
            'Select your desired unit from the dropdown or toggle your design outputs.',
            'Customize the display or formatting HE, CM, Meter, Inch, and Feet.',
        ],
        image: '/images/unit-converter-brief-2.svg',
        imageAlt: 'Unit selection dropdown interface',
    },
    {
        toolName: 'unit-converter',
        order: 3,
        toolID: 'unit-converter',
        title: 'Change DPI',
        subtitle: 'You can alter the resolution of your exported files.',
        bullets: [
            'Adjust your desired DPI from the dropdown menu to match your output resolution.',
            'Changing the DPI will dynamically affect the pixel dimensions of your final output, giving you precise control over your output.',
        ],
        image: '/images/unit-converter-brief-3.svg',
        imageAlt: 'DPI adjustment interface',
    },
    {
        toolName: 'unit-converter',
        order: 4,
        toolID: 'unit-converter',
        title: 'Add Bleed Marks',
        subtitle: 'Add professional bleed marks to your designs.',
        bullets: [
            'Enable bleed with a simple click.',
            'Customize the margins on each side.',
            'Use the link icon to apply a uniform bleed simultaneously to all sides.',
        ],
        image: '/images/unit-converter-brief-4.svg',
        imageAlt: 'Bleed marks settings panel',
    },
    {
        toolName: 'unit-converter',
        order: 5,
        toolID: 'unit-converter',
        title: 'Export as Frame & Save as Preset',
        subtitle: 'Instantly create a new frame in your Figma file with the converted settings, or save your settings as a custom preset for later.',
        bullets: [
            'Select Export as Frame to save your settings as a canvas frame.',
            'Quickly unlock new frame creation for customizable combinations.',
        ],
        image: '/images/unit-converter-brief-5.svg',
        imageAlt: 'Export and preset options',
    },
    {
        toolName: 'unit-converter',
        order: 6,
        toolID: 'unit-converter',
        title: 'Access to pre built presets',
        subtitle: 'Instant access to a library of pre-made presets for all your print needs.',
        bullets: [
            'A comprehensive library of card sizes, poster templates, and more.',
            'Easily filter the presets by category to find the perfect starting point for your project.',
        ],
        image: '/images/unit-converter-brief-6.svg',
        imageAlt: 'Pre-built presets library',
    },
    {
        toolName: 'unit-converter',
        order: 7,
        toolID: 'unit-converter',
        title: 'Make your own presets',
        subtitle: 'Save a custom frame size with settings as a new preset.',
        bullets: [
            'Manage all of the presets you have saved using the edit button.',
            'Click on "Save as Preset" button and give your preset a name.',
            'Find your presets in the "Your Presets" section.',
        ],
        image: '/images/unit-converter-brief-7.svg',
        imageAlt: 'Custom preset creation interface',
    },
];

// ============================================================================
// IMPORT TOOLS / FILE IMPORTER SLIDES (6 slides)
// ============================================================================
const fileImporterSlides = [
    {
        toolName: 'file-importer',
        order: 1,
        toolID: 'file-importer',
        title: 'Choose Your File Format',
        subtitle: 'Start by selecting the format you want to import.',
        bullets: [
            'Pick the file type from the import tab.',
            'Each format follows the same easy steps.',
            'GPX import available now.',
        ],
        image: '/images/file-importer/1.png',
        imageAlt: 'File format selection interface',
    },
    {
        toolName: 'file-importer',
        order: 2,
        toolID: 'file-importer',
        title: 'Instant File Preview',
        subtitle: 'See inside your file before importing it.',
        bullets: [
            'Auto-analyzer analyzes the file on load.',
            'Get a live overview of your design.',
            'See the preview on larger view with a single icon.',
        ],
        image: '/images/file-importer/2.png',
        imageAlt: 'File preview panel',
    },
    {
        toolName: 'file-importer',
        order: 3,
        toolID: 'file-importer',
        title: 'Automatic Content Detection',
        subtitle: "Instantly understand what's inside your file for a fast edit.",
        bullets: [
            'Automatically detects key elements like text, fonts, and vector data.',
            'Prepares your file for a smooth import experience.',
        ],
        image: '/images/file-importer/3.png',
        imageAlt: 'Content detection results',
    },
    {
        toolName: 'file-importer',
        order: 4,
        toolID: 'file-importer',
        title: 'Clear Compatibility Checks',
        subtitle: 'Know what works before you import.',
        bullets: [
            "See what's already supported in your workspace.",
            'Highlights missing or unsupported items clearly.',
            'Helps prevent layout or styling issues.',
        ],
        image: '/images/file-importer/4.png',
        imageAlt: 'Compatibility check results',
    },
    {
        toolName: 'file-importer',
        order: 5,
        toolID: 'file-importer',
        title: 'Clear Warnings Before Import',
        subtitle: 'Avoid accidental changes to your file.',
        bullets: [
            'Helpful alerts if anything may be missing.',
            'Simple explanation of what will happen.',
            'Choose to proceed or adjust settings.',
        ],
        image: '/images/file-importer/5.png',
        imageAlt: 'Import warnings dialog',
    },
    {
        toolName: 'file-importer',
        order: 6,
        toolID: 'file-importer',
        title: 'Quick Actions & Favorites',
        subtitle: 'Keep frequently used formats within easy reach.',
        bullets: [
            'Add frequently used tools to Favorites.',
            'Access them faster without searching again.',
            'Stay consistent across imports and workflows.',
        ],
        image: '/images/file-importer/6.png',
        imageAlt: 'Quick actions and favorites panel',
    },
];

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================
async function seedDatabase() {
    const mongoUri = process.env.NEXT_PUBLIC_MONGODB_URI_TOOLS;

    if (!mongoUri) {
        console.error('Error: No MongoDB URI found. Set NEXT_PUBLIC_MONGODB_URI_TOOLS in .env');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Combine all slides
    const allSlides = [
        ...palettableSlides,
        ...framesToPdfSlides,
        ...unitConverterSlides,
        ...fileImporterSlides,
    ];

    const toolSlugs = toolsData.map(t => t.slug);

    console.log('\n========================================');
    console.log('SEEDING TOOLS');
    console.log('========================================');
    console.log(`Total tools to seed: ${toolsData.length}`);
    toolsData.forEach(t => console.log(`  - ${t.name} (${t.slug})`));

    // Delete existing tools
    console.log('\nClearing existing tools...');
    const deleteToolsResult = await Tool.deleteMany({ slug: { $in: toolSlugs } });
    console.log(`Deleted ${deleteToolsResult.deletedCount} existing tools`);

    // Insert tools
    console.log('\nInserting tools...');
    const insertToolsResult = await Tool.insertMany(toolsData);
    console.log(`Successfully inserted ${insertToolsResult.length} tools`);

    console.log('\n========================================');
    console.log('SEEDING SLIDES');
    console.log('========================================');
    console.log(`Total slides to seed: ${allSlides.length}`);
    console.log('- Palettable: 5 slides');
    console.log('- Frames to PDF: 8 slides');
    console.log('- Unit Converter: 7 slides');
    console.log('- File Importer: 6 slides');

    // Delete existing slides for these tools
    console.log('\nClearing existing slides...');
    const deleteSlidesResult = await Slide.deleteMany({ toolName: { $in: toolSlugs } });
    console.log(`Deleted ${deleteSlidesResult.deletedCount} existing slides`);

    // Insert new slides
    console.log('\nInserting slides...');
    const insertSlidesResult = await Slide.insertMany(allSlides);
    console.log(`Successfully inserted ${insertSlidesResult.length} slides`);

    // Verify insertion
    console.log('\n========================================');
    console.log('VERIFICATION');
    console.log('========================================');

    console.log('\nTools in database:');
    for (const slug of toolSlugs) {
        const tool = await Tool.findOne({ slug });
        console.log(`  ${slug}: ${tool ? 'OK' : 'MISSING'}`);
    }

    console.log('\nSlides per tool:');
    for (const slug of toolSlugs) {
        const count = await Slide.countDocuments({ toolName: slug });
        console.log(`  ${slug}: ${count} slides`);
    }

    console.log('\n========================================');
    console.log('SEED COMPLETED SUCCESSFULLY!');
    console.log('========================================');

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
}

// Run the seed
seedDatabase().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});
