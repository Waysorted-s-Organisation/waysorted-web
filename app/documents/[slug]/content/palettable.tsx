export default function Palettable() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Palettable</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Palettable is Waysorted&apos;s powerful color palette generation tool that helps designers create harmonious color schemes using AI-powered suggestions and advanced color theory.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Key Features</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">AI-Powered Generation</span>: Generate beautiful color palettes based on mood, industry, or seed colors using machine learning.</li>
        <li><span className="text-secondary-db-100">Color Harmony</span>: Create complementary, analogous, triadic, and other color schemes automatically.</li>
        <li><span className="text-secondary-db-100">Accessibility Check</span>: Ensure your palettes meet WCAG contrast requirements for text and UI elements.</li>
        <li><span className="text-secondary-db-100">Export Options</span>: Export palettes as CSS variables, Tailwind config, design tokens, or image swatches.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Using Palettable</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Start from Scratch</span>: Click &quot;Generate&quot; to create a random palette or input a base color to build around.</li>
        <li><span className="text-secondary-db-100">Upload Image</span>: Extract color palettes from uploaded images or inspiration photos.</li>
        <li><span className="text-secondary-db-100">Fine-Tune Colors</span>: Adjust hue, saturation, and lightness of individual colors while maintaining harmony.</li>
        <li><span className="text-secondary-db-100">Save to Library</span>: Store your favorite palettes in your personal library for quick access.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Integration with Figma</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Apply palettes directly to your Figma designs with one click. Palettable syncs with your Figma color styles, making it easy to update your entire design system&apos;s colors instantly.
      </p>
    </>
  );
}
