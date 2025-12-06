export default function WaysortedApiDocumentation() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Developer Focused Guide</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Build integrations and automate workflows with the Waysorted API. This guide covers authentication, common patterns, and best practices.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Getting started</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Generate keys</span>: Create API keys in workspace settings.</li>
        <li><span className="text-secondary-db-100">Test sandbox</span>: Use the test environment to validate flows.</li>
        <li><span className="text-secondary-db-100">Read SDKs</span>: Official clients are available for Node, Python, and Go.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Overview and Authentication</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Understand the API structure, versioning, and authentication methods before making requests.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Core concepts</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Base URL</span>: https://api.waysorted.com/v1.</li>
        <li><span className="text-secondary-db-100">Auth</span>: Bearer token via API key or OAuth 2.0.</li>
        <li><span className="text-secondary-db-100">Versioning</span>: Include version in URL; deprecations communicated in advance.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Examples</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Browse sample requests and responses for common operations. Copy snippets to jumpstart your integration.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Sample operations</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">List plugins</span>: GET /plugins with optional filters.</li>
        <li><span className="text-secondary-db-100">Create file</span>: POST /files with multipart payload.</li>
        <li><span className="text-secondary-db-100">Update settings</span>: PATCH /workspace/settings with partial body.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Rate Limits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Rate limits protect the platform and ensure fair access. Monitor headers and implement backoff when approaching thresholds.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Limits and headers</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Default</span>: 1,000 requests per minute per key.</li>
        <li><span className="text-secondary-db-100">Headers</span>: X-RateLimit-Remaining, X-RateLimit-Reset.</li>
        <li><span className="text-secondary-db-100">Backoff</span>: Use exponential backoff on 429 responses.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Webhooks</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Receive real-time events via webhook endpoints. Configure URLs, verify signatures, and handle retries gracefully.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Setup and security</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Register</span>: Add endpoint URLs in webhook settings.</li>
        <li><span className="text-secondary-db-100">Verify</span>: Check HMAC signature before processing.</li>
        <li><span className="text-secondary-db-100">Retries</span>: We retry with exponential backoff on non-2xx.</li>
      </ul>
    </>
  );
}
