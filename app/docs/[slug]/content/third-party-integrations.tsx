export default function ThirdPartyIntegrations() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Third-Party Integrations</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Extend Waysorted&apos;s capabilities by connecting with third-party tools and services. Integrate with your existing workflow for maximum productivity.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Available Integrations</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Cloud Storage</span>: Connect Google Drive, Dropbox, or OneDrive for automatic asset backup.</li>
        <li><span className="text-secondary-db-100">Project Management</span>: Integrate with Notion, Jira, or Asana to link designs with tasks.</li>
        <li><span className="text-secondary-db-100">Communication</span>: Receive notifications in Slack or Microsoft Teams when designs are updated.</li>
        <li><span className="text-secondary-db-100">Version Control</span>: Connect with GitHub to track design changes alongside code.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Setting Up Integrations</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Browse Integrations</span>: Visit Settings &gt; Integrations to see all available connections.</li>
        <li><span className="text-secondary-db-100">Authorize Access</span>: Click &quot;Connect&quot; and authorize Waysorted to access the third-party service.</li>
        <li><span className="text-secondary-db-100">Configure Settings</span>: Customize how data flows between Waysorted and connected services.</li>
        <li><span className="text-secondary-db-100">Test Connection</span>: Verify the integration is working by testing with sample data.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">API Access</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        For custom integrations, use our REST API to build your own connections. Generate API keys in Settings &gt; Developer and refer to our API documentation for endpoints and usage examples.
      </p>
    </>
  );
}
