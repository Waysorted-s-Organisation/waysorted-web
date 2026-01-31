export default function DeveloperFocusedGuide() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Developer-Focused Guide</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        This documentation provides comprehensive details for integrating Waysorted&apos;s suite of design file processing APIs into your applications. These APIs power key features in the Waysorted Figma plugin ecosystem, enabling efficient handling of EPS, PDF, PSD, and related formats. Built on FastAPI for robustness and scalability, they emphasize secure file handling, asynchronous processing where needed, and JSON-based responses for easy parsing.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        The APIs are optimized for server-to-server calls from design tools, CI/CD pipelines, or custom scripts. All operations respect Waysorted&apos;s credit system, where complex tasks (e.g., high-DPI conversions) consume variable credits&mdash;tracked via your account dashboard. For production use, monitor credit balances to avoid interruptions.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Key principles:</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100 font-semibold">Idempotency</span>: Use job IDs in requests to retry safely without duplicates.</li>
        <li><span className="text-secondary-db-100 font-semibold">Error Handling</span>: Standardized JSON errors with HTTP status codes (e.g., <code className="bg-secondary-db-10 px-1 rounded">{`{ "error": "InvalidFileType", "message": "Only EPS files supported" }`}</code>).</li>
        <li><span className="text-secondary-db-100 font-semibold">File Security</span>: Temporary signed URLs for uploads/downloads; files auto-delete after 24 hours.</li>
        <li><span className="text-secondary-db-100 font-semibold">Versioning</span>: All endpoints prefixed with /v1/ for future-proofing.</li>
      </ul>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
