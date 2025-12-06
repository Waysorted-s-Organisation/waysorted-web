export default function Diagnostics() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Diagnostics</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Use Waysorted&apos;s diagnostic tools to identify and troubleshoot issues with your setup, connections, and plugin performance.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Running Diagnostics</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">System Check</span>: Navigate to Settings &gt; Diagnostics to run a comprehensive system health check.</li>
        <li><span className="text-secondary-db-100">Connection Test</span>: Verify connectivity to Waysorted servers and Figma APIs.</li>
        <li><span className="text-secondary-db-100">Plugin Validation</span>: Check installed plugins for compatibility issues or updates.</li>
        <li><span className="text-secondary-db-100">Cache Status</span>: View cached data size and clear cache to resolve storage-related issues.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Diagnostic Reports</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Generate Report</span>: Create a detailed diagnostic report to share with support for troubleshooting.</li>
        <li><span className="text-secondary-db-100">Error Logs</span>: Access recent error logs to identify patterns or recurring issues.</li>
        <li><span className="text-secondary-db-100">Performance Metrics</span>: View plugin load times, memory usage, and API response times.</li>
        <li><span className="text-secondary-db-100">Version Information</span>: Check current versions of Waysorted, plugins, and dependencies.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Self-Service Fixes</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        The diagnostics page offers one-click fixes for common issues, including cache clearing, token refresh, and plugin reinstallation. Try these automated fixes before contacting support.
      </p>
    </>
  );
}
