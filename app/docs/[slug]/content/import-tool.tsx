export default function ImportTool() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Import Tool</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        The Import Tool enables seamless file importing into your Figma projects, supporting a wide range of formats and maintaining design fidelity throughout the conversion process.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Supported File Formats</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Vector Formats</span>: Import SVG, EPS, and AI files with preserved paths and layer structure.</li>
        <li><span className="text-secondary-db-100">Image Formats</span>: Support for PNG, JPG, WebP, and GIF files with optimization options.</li>
        <li><span className="text-secondary-db-100">Document Formats</span>: Import PDF pages as editable vector elements where possible.</li>
        <li><span className="text-secondary-db-100">Design Files</span>: Convert Sketch and XD files to Figma-compatible formats.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Import Options</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Batch Import</span>: Upload multiple files simultaneously and import them in one operation.</li>
        <li><span className="text-secondary-db-100">Layer Preservation</span>: Maintain original layer names, groups, and hierarchy from source files.</li>
        <li><span className="text-secondary-db-100">Scale Options</span>: Choose import scale or let the tool auto-detect optimal dimensions.</li>
        <li><span className="text-secondary-db-100">Placement</span>: Select where imported assets appear on your canvas or frame.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Best Practices</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        For best results, ensure source files are properly organized before importing. Use outlined fonts in vector files, flatten complex effects, and optimize images before upload to maintain quality and reduce file size.
      </p>
    </>
  );
}
