export default function OverviewAndAuthentication() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Overview and Authentication</h2>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Service Overview</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted exposes four core APIs, each handling a specific file transformation need in design workflows:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        <li><span className="text-secondary-db-100 font-semibold">EPS Font Recognition API</span>: Analyzes EPS files to detect embedded fonts, leveraging a comprehensive Google Fonts database (1,400+ fonts) for fuzzy matching, category classification (e.g., serif, sans-serif), and similarity suggestions. Ideal for font auditing in vector graphics pipelines. Supports real-time processing with confidence scores and popularity-weighted results.</li>
        <li><span className="text-secondary-db-100 font-semibold">PDF to CMYK Converter API</span>: Processes RGB PDFs to CMYK color space using Ghostscript, suitable for print-ready outputs. Includes progress tracking and storage integration for original/converted files. Deployed with auto-scaling for batch jobs.</li>
        <li><span className="text-secondary-db-100 font-semibold">PSD to SVG Converter API</span>: Renders layered PSD files as editable SVGs via psd-tools and Pillow, preserving composites and enabling web-friendly exports. Features signed upload flows and polling for completion, with optional task queuing for large files.</li>
        <li><span className="text-secondary-db-100 font-semibold">PDF DPI Converter API</span>: Upscales or downscales PDF resolution via Ghostscript, with user-selectable DPI presets (e.g., 72, 150, 300). Manages metadata in a NoSQL store for status queries, supporting secure, resumable uploads.</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Each API follows RESTful conventions with multipart/form-data for file uploads and JSON for metadata/responses. Processing times vary: &lt;5s for simple detections, up to 2min for complex conversions (with polling endpoints).
      </p>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
