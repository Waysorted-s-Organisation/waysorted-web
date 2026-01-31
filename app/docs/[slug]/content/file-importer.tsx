export default function ImportTool() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Import Tool Specifications</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        A versatile importer that converts various file types into editable Figma elements, streamlining asset migration and data integration.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Supported Formats</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Vector/Design</span>: EPS, PSD, AI</li>
        <li><span className="text-secondary-db-100">Data</span>: JSON, CSV</li>
        <li><span className="text-secondary-db-100">3D</span>: FBX</li>
        <li><span className="text-secondary-db-100">Presentation</span>: PowerPoint (PPTX)</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Font Handling</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Detection</span>: Automatically detects required fonts from imported files.</li>
        <li><span className="text-secondary-db-100">Resolution</span>: Suggests equivalent Google Fonts for download or provides an option to vectorize text for compatibility.</li>
      </ul>

      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        The Heavy Imports will consume credits later on. Go to Credits for more info.
      </p>
      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
      </p>
    </>
  );
}
