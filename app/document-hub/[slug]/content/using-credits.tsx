export default function UsingCredits() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Using Credits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Credits represent the relative system cost of using different tools and actions across platforms. This includes operations such as exports, imports, conversions, and advanced processing.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">In beta:</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li>Credits are shown for visibility only</li>
        <li>No actions are blocked</li>
        <li>No deductions limit usage</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        In future releases, credits will help ensure fair access across all supported software environments.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Export Tools</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Export tools convert designs or assets into shareable formats. Usage indicators vary based on factors such as file size, resolution, and batch operations. These indicators are informational only during beta.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Paletteable</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Palette generation uses lightweight computation for standard use cases, with higher indicators for accessibility simulations or complex color sets. All features remain fully accessible in beta.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Unit Conversion</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Unit conversion primarily relies on mathematical operations. Advanced presets such as DPI, bleed, or saved configurations may display higher usage indicators for transparency.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Import Tools</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Import tools handle external files and data. Usage indicators scale with file complexity and size to reflect processing cost. Previews remain accessible without restriction.
      </p>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
