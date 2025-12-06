export default function General() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Getting Started</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted is a comprehensive platform designed to address common challenges in design workflows, such as compatibility issues, scattered support, performance slowdowns, and budget drain from multiple plugin subscriptions. By bundling plugins into curated packs, offering a credit system, and providing an all-in-one marketplace, Waysorted streamlines access to tools while promoting community-driven growth.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Key Features</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Bundled Plugins</span>: Access 4 initial plugins (some AI-powered) for tasks like PDF exporting, color palette generation, unit conversion, and file importing.</li>
        <li><span className="text-secondary-db-100">Reward System</span>: Earn points through usage and contributions, redeemable for free plugins or discounts.</li>
        <li><span className="text-secondary-db-100">All-in-One Marketplace</span>: Discover, submit, and monetize plugins in a single ecosystem.</li>
        <li><span className="text-secondary-db-100">Freemium Model</span>: Start with free access to all advanced features.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Account Creation and Setup</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Set up your Waysorted account with a verified email, secure password, and workspace defaults that match your team. Keep recovery contacts handy and enable MFA to protect access from day one.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Steps to get started</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Sign up</span>: Use a work email, confirm the verification link, and set a strong password.</li>
        <li><span className="text-secondary-db-100">Secure access</span>: Enable multi-factor authentication and store backup codes safely.</li>
        <li><span className="text-secondary-db-100">Workspace basics</span>: Name your workspace, choose language and region, and set default permissions.</li>
        <li><span className="text-secondary-db-100">Invite teammates</span>: Add members with the right roles and resend pending invites if needed.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Quick Integration with Figma</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Install the Waysorted plugin, grant file access, and sync a sample file to verify layers and components map correctly. Keep one test file ready to validate the connection without touching production work.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Integration steps</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Install</span>: Add the Waysorted plugin from Figma Community and sign in with your workspace account.</li>
        <li><span className="text-secondary-db-100">Authorize</span>: Approve read access for the files you plan to sync and confirm team permissions.</li>
        <li><span className="text-secondary-db-100">Test sync</span>: Open a sample file, run the plugin, and check components and pages appear in Waysorted.</li>
        <li><span className="text-secondary-db-100">Troubleshoot</span>: If items are missing, refresh the plugin, re-authenticate, and rerun the sync.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">FAQs</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Quick answers for billing, access, integrations, and troubleshooting. Use these summaries to resolve common issues before reaching support.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">What people ask most</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Billing</span>: Update cards, download invoices, and change plans directly from workspace billing.</li>
        <li><span className="text-secondary-db-100">Access</span>: Resend invites, adjust roles, and reset MFA from profile security.</li>
        <li><span className="text-secondary-db-100">Integrations</span>: Re-auth Figma or third-party tools when tokens expire.</li>
        <li><span className="text-secondary-db-100">Troubleshooting</span>: Clear cache, retry sync, and check status page for incidents.</li>
      </ul>
    </>
  );
}
