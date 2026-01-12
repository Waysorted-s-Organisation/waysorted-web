const fs = require('fs');

try {
    const content = fs.readFileSync('recovered_slides.json', 'utf8');
    const data = JSON.parse(content);

    if (!data.slides) {
        console.error('No slides property found');
        process.exit(1);
    }

    const newSlides = data.slides.map((s, i) => ({
        toolName: 'Frames to PDF',
        order: i + 1,
        toolID: 'tool_frames-to-pdf',
        title: s.title || 'Frames to PDF',
        subtitle: s.subtitle || '',
        bullets: s.bullets || [],
        image: `/images/frames-to-pdf/${i + 1}.png`,
        imageAlt: s.imageAlt || `Frames to PDF Slide ${i + 1}`
    }));

    const code = `
  if (slug === 'frames-to-pdf') {
    const slides = ${JSON.stringify(newSlides, null, 6).replace(/"([^"]+)":/g, '$1:')};
    return NextResponse.json(
      { slides },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  }
`;

    console.log(code);
} catch (e) {
    console.error(e);
}
