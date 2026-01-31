export default function Palettable() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Paletteable Specifications</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        An advanced color management tool developed specifically for professional design workflows. It offers comprehensive color manipulation, professional accessibility testing, and seamless export capabilities.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Core Features</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Base Color</span>: Starting color that serves as the base for palette generation. Accepts HEX, RGB, and HSL formats.</li>
        <li><span className="text-secondary-db-100">Variation Types</span>: Brighten, Darken, Desaturate, Hue, Analogous, Monochromatic, Complementary, Split-Complementary, Triad, and Tetrad.</li>
        <li><span className="text-secondary-db-100">Step Slider</span>: Defines the number of color variations to generate.</li>
        <li><span className="text-secondary-db-100">Intensity Slider</span>: Controls the magnitude of change between each step.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Accessibility Checks</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Contrast Ratios</span>: Real-time evaluation against WCAG (AA/AAA) and APCA standards.</li>
        <li><span className="text-secondary-db-100">Check List</span>: Includes a list of color checks designers need to take care and should pass when creating a design.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Export</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Generated palettes can be exported for direct use in Figma.
      </p>
      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
      </p>
    </>
  );
}
