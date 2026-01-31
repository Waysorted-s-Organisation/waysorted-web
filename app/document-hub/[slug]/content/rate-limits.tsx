export default function RateLimits() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Rate Limits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Rate limits protect system resources and align with Waysorted&apos;s credit model. Limits are enforced per API key and reset hourly/daily.
      </p>

      <div className="overflow-x-auto mt-6">
        <table className="min-w-full text-secondary-db-70 text-lg border-collapse">
          <thead>
            <tr className="border-b border-secondary-db-30">
              <th className="text-left py-2 pr-4 text-secondary-db-100 font-semibold">Limit Type</th>
              <th className="text-left py-2 pr-4 text-secondary-db-100 font-semibold">Value</th>
              <th className="text-left py-2 pr-4 text-secondary-db-100 font-semibold">Scope</th>
              <th className="text-left py-2 text-secondary-db-100 font-semibold">Exceeded Response</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-secondary-db-20">
              <td className="py-2 pr-4">Requests per Minute (RPM)</td>
              <td className="py-2 pr-4">60</td>
              <td className="py-2 pr-4">Per API</td>
              <td className="py-2">429 Too Many Requests: <code className="text-sm bg-secondary-db-10 px-1 rounded">{`{ "error": "RateLimitExceeded", "retry_after": 60 }`}</code></td>
            </tr>
            <tr className="border-b border-secondary-db-20">
              <td className="py-2 pr-4">Daily Requests</td>
              <td className="py-2 pr-4">1,000</td>
              <td className="py-2 pr-4">Per API Key</td>
              <td className="py-2">429 (burst allowed up to 1,200)</td>
            </tr>
            <tr className="border-b border-secondary-db-20">
              <td className="py-2 pr-4">Concurrent Jobs</td>
              <td className="py-2 pr-4">5</td>
              <td className="py-2 pr-4">Per User</td>
              <td className="py-2">503 Service Unavailable</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">File Size</td>
              <td className="py-2 pr-4">50MB</td>
              <td className="py-2 pr-4">Per Upload</td>
              <td className="py-2">413 Payload Too Large</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
