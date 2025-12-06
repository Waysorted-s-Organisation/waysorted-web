export default function UnitConverter() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Unit Converter</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        The Unit Converter tool simplifies the process of converting between different measurement units commonly used in design and development, ensuring consistency across your projects.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Supported Conversions</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Length Units</span>: Convert between pixels (px), points (pt), ems, rems, percentages, and viewport units (vw, vh).</li>
        <li><span className="text-secondary-db-100">Typography</span>: Transform font sizes across different scales and calculate line heights.</li>
        <li><span className="text-secondary-db-100">Spacing</span>: Convert margin and padding values for responsive design implementation.</li>
        <li><span className="text-secondary-db-100">Screen Density</span>: Calculate @1x, @2x, and @3x asset dimensions for different device densities.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How to Use</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Quick Convert</span>: Enter a value and select source and target units for instant conversion.</li>
        <li><span className="text-secondary-db-100">Batch Conversion</span>: Convert multiple values at once by pasting a list of measurements.</li>
        <li><span className="text-secondary-db-100">Base Settings</span>: Configure your root font size and viewport dimensions for accurate calculations.</li>
        <li><span className="text-secondary-db-100">Copy Results</span>: One-click copy of converted values in various formats for your code.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Design System Integration</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Unit Converter integrates with your Figma design system, automatically detecting your base units and applying conversions contextually. Perfect for maintaining consistency when handing off designs to developers.
      </p>
    </>
  );
}
