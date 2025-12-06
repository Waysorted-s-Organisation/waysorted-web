export default function RateLimits() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Rate Limits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        To ensure fair usage and maintain service quality, the Waysorted API implements rate limiting. Understanding these limits helps you build reliable integrations.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Rate Limit Tiers</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Free Tier</span>: 100 requests per minute, 1,000 requests per day.</li>
        <li><span className="text-secondary-db-100">Pro Tier</span>: 500 requests per minute, 10,000 requests per day.</li>
        <li><span className="text-secondary-db-100">Enterprise Tier</span>: Custom limits based on your agreement and needs.</li>
        <li><span className="text-secondary-db-100">Burst Allowance</span>: Short bursts above limit are allowed but may trigger throttling.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Response Headers</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">X-RateLimit-Limit</span>: Maximum requests allowed in the current window.</li>
        <li><span className="text-secondary-db-100">X-RateLimit-Remaining</span>: Number of requests remaining in current window.</li>
        <li><span className="text-secondary-db-100">X-RateLimit-Reset</span>: Unix timestamp when the rate limit window resets.</li>
        <li><span className="text-secondary-db-100">Retry-After</span>: Seconds to wait before retrying when rate limited (429 response).</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Handling Rate Limits</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Implement exponential backoff when you receive 429 responses. Cache responses when possible to reduce API calls. Monitor your usage through the developer dashboard to stay within limits.
      </p>
    </>
  );
}
