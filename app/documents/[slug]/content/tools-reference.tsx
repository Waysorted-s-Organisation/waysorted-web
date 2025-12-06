export default function ToolsReference() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Palettable</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Generate balanced palettes, test contrast, and export tokens to your design system. Palettable keeps accessibility in view while you explore options.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How to use</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Create sets</span>: Build base, accent, and semantic colors with on-canvas previews.</li>
        <li><span className="text-secondary-db-100">Check contrast</span>: Validate WCAG compliance before exporting.</li>
        <li><span className="text-secondary-db-100">Export tokens</span>: Send variables to Figma or download JSON for code.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Unit Converter</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Translate sizes, spacing, and typography units without leaving your design flow. The converter handles px, rem, em, pt, and percentages with rounding controls.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Usage</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Select units</span>: Choose input and output units from the dropdown.</li>
        <li><span className="text-secondary-db-100">Apply ratio</span>: Toggle base font size for rem/em accuracy.</li>
        <li><span className="text-secondary-db-100">Copy results</span>: Copy converted values directly into your design spec.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Import Tool</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Bring external assets into Waysorted while preserving structure and metadata. The import tool validates file types and flags conflicts before commit.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Import steps</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Select source</span>: Choose files or link a repository folder.</li>
        <li><span className="text-secondary-db-100">Validate</span>: Review detected issues like duplicates or unsupported formats.</li>
        <li><span className="text-secondary-db-100">Confirm</span>: Map destinations, then import with a summary of changes.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Upcoming Tools</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Preview tools in development and understand how they will extend your workflow. Share feedback early to influence the roadmap.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">In-progress ideas</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Haptic previews</span>: Test tactile responses for hardware-ready designs.</li>
        <li><span className="text-secondary-db-100">Cloud sync</span>: Back up design assets and version history automatically.</li>
        <li><span className="text-secondary-db-100">Automation hooks</span>: Trigger workflows when files update or reviews complete.</li>
      </ul>
    </>
  );
}
