export default function DeveloperFocusedGuide() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Developer Focused Guide</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        This comprehensive guide is designed for developers looking to integrate Waysorted&apos;s capabilities into their applications, build custom plugins, or extend platform functionality.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Getting Started for Developers</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Developer Account</span>: Enable developer mode in Settings &gt; Developer to access API features.</li>
        <li><span className="text-secondary-db-100">API Keys</span>: Generate API keys for authentication in your applications.</li>
        <li><span className="text-secondary-db-100">Sandbox Environment</span>: Use our sandbox for testing without affecting production data.</li>
        <li><span className="text-secondary-db-100">SDK Options</span>: Choose from JavaScript, Python, or REST API for integration.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Development Resources</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">API Reference</span>: Complete documentation of all available endpoints and parameters.</li>
        <li><span className="text-secondary-db-100">Code Samples</span>: Ready-to-use code examples in multiple programming languages.</li>
        <li><span className="text-secondary-db-100">Postman Collection</span>: Import our Postman collection for quick API testing.</li>
        <li><span className="text-secondary-db-100">GitHub Repos</span>: Access open-source SDKs and example projects on our GitHub.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Developer Support</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Join our developer community on Discord for real-time help, or post questions on our developer forum. For enterprise integrations, contact our developer relations team at developers@waysorted.com.
      </p>
    </>
  );
}
