export default function IntegrationsAndCloud() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Figma Sync</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Keep designs in sync between Figma and Waysorted. The sync respects versioning so you can track changes and roll back when needed.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Sync workflow</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Connect</span>: Authorize Figma and choose files to watch.</li>
        <li><span className="text-secondary-db-100">Sync</span>: Push or pull updates with conflict alerts.</li>
        <li><span className="text-secondary-db-100">Version</span>: Compare snapshots and restore previous states.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Backup and Recovery</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Automatic backups capture snapshots on a regular schedule. Restore files from any checkpoint without downtime.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How backups work</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Schedule</span>: Backups run daily with hourly incremental saves.</li>
        <li><span className="text-secondary-db-100">Retention</span>: Checkpoints kept for 30 days by default.</li>
        <li><span className="text-secondary-db-100">Restore</span>: Choose a point in time and recover selected assets.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Third-Party Integrations</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Connect Waysorted with external services like Slack, Jira, and GitHub. Integrations follow OAuth flows and respect workspace permissions.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Available integrations</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Slack</span>: Receive notifications and share updates in channels.</li>
        <li><span className="text-secondary-db-100">Jira</span>: Link designs to issues and track status.</li>
        <li><span className="text-secondary-db-100">GitHub</span>: Sync tokens and assets with repositories.</li>
        <li><span className="text-secondary-db-100">Custom</span>: Use webhooks for unsupported services.</li>
      </ul>
    </>
  );
}
