export default function UnitConverter() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-secondary-db-100 mb-4">Unit Conversion Specifications</h1>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        A precision tool for converting design dimensions between different units, optimized for both print and digital outputs.
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Supported Units</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Millimeters (MM), Centimeters (CM), Inches (IN), Meters (M).
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">DPI Control</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Adjustable DPI (Dots Per Inch) settings (e.g., 72, 150, 300) for print resolution accuracy.
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Bleed Margins</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Independent controls for setting Top, Bottom, Left, and Right bleed values with Crop marks.
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Orientation Toggle</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Single-click switching between Portrait and Landscape.
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Presets</h2>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Standard Presets</span>: Banners, V-cards, Standees, Bi-folds, Brochures.</li>
        <li><span className="text-secondary-db-100">Custom Presets</span>: Functionality to save and name custom dimension configurations for repeated use.</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
      </p>
    </>
  );
}
