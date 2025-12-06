export default function OverviewAndAuthentication() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Overview and Authentication</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        The Waysorted API provides programmatic access to platform features. This guide covers the API architecture and how to authenticate your requests.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">API Overview</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">REST Architecture</span>: Our API follows RESTful principles with predictable resource-oriented URLs.</li>
        <li><span className="text-secondary-db-100">JSON Responses</span>: All responses are returned in JSON format with consistent structure.</li>
        <li><span className="text-secondary-db-100">HTTPS Required</span>: All API requests must be made over HTTPS for security.</li>
        <li><span className="text-secondary-db-100">Base URL</span>: All endpoints are relative to https://api.waysorted.com/v1/</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Authentication Methods</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">API Keys</span>: Use API keys for server-to-server communication. Include in the Authorization header.</li>
        <li><span className="text-secondary-db-100">OAuth 2.0</span>: For user-facing applications, implement OAuth 2.0 flow for delegated access.</li>
        <li><span className="text-secondary-db-100">Bearer Tokens</span>: Include tokens as &quot;Bearer YOUR_TOKEN&quot; in request headers.</li>
        <li><span className="text-secondary-db-100">Scopes</span>: Request only the permissions your application needs using OAuth scopes.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Security Best Practices</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Never expose API keys in client-side code. Rotate keys regularly and use environment variables for storage. Implement proper error handling and never log sensitive credentials.
      </p>
    </>
  );
}
