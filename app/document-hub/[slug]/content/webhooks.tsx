export default function Webhooks() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Webhooks</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Webhooks enable asynchronous notifications for long-running tasks (e.g., conversions &gt;10s), reducing polling overhead. Supported for CMYK, PSD, and DPI APIs; EPS is synchronous.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Setup</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100 font-semibold">Registration</span>: POST to /v1/webhooks/register with <code className="text-sm bg-secondary-db-10 px-1 rounded">{`{ "url": "https://yourapp.com/waysorted-callback", "events": ["conversion.completed", "conversion.failed"], "secret": "your-hmac-secret" }`}</code>.</li>
        <li><span className="text-secondary-db-100 font-semibold">Verification</span>: Waysorted sends a challenge POST with <code className="text-sm bg-secondary-db-10 px-1 rounded">{`{"challenge": "token-123"}`}</code>; echo back in response body.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Events:</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100 font-semibold">job.started</span>: <code className="text-sm bg-secondary-db-10 px-1 rounded">{`{ "job_id": "...", "type": "cmyk_convert" }`}</code></li>
        <li><span className="text-secondary-db-100 font-semibold">job.completed</span>: <code className="text-sm bg-secondary-db-10 px-1 rounded">{`{ "job_id": "...", "download_url": "...", "credits_consumed": 10 }`}</code></li>
        <li><span className="text-secondary-db-100 font-semibold">job.failed</span>: <code className="text-sm bg-secondary-db-10 px-1 rounded">{`{ "job_id": "...", "error": "GhostscriptTimeout" }`}</code></li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Security:</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li>Payloads HMAC-SHA256 signed with your secret (header: X-Webhook-Signature). Verify on receipt.</li>
        <li>Retries: Exponential backoff (up to 5 attempts, 1h window) on 5xx/timeout; idempotent via X-Waysorted-Idempotency-Key.</li>
        <li>Unregister: DELETE /v1/webhooks/&#123;webhook_id&#125;.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Example Payload (Completed):</h3>
      <pre className="bg-secondary-db-10 p-4 rounded-lg text-secondary-db-70 text-sm overflow-x-auto mt-4">
        {`json
{
  "event": "job.completed",
  "timestamp": "2025-10-30T12:00:00Z",
  "data": {
    "job_id": "cmyk-job-uuid-456",
    "result": { "download_url": "https://...", "status": "success" }
  },
  "signature": "sha256=abc123..."
}`}
      </pre>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Handling in Node.js:</h3>
      <pre className="bg-secondary-db-10 p-4 rounded-lg text-secondary-db-70 text-sm overflow-x-auto mt-4">
        {`javascript
app.post('/waysorted-callback', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const expected = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    // Process event
    res.status(200).send('OK');
  } else {
    res.status(401).send('Invalid signature');
  }
});`}
      </pre>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
