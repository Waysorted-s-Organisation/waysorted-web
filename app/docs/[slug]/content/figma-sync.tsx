export default function FigmaSync() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Figma Sync</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Figma Sync enables real-time synchronization between Waysorted and your Figma projects, ensuring your tools, settings, and data stay up-to-date across both platforms.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Sync Features</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Color Styles</span>: Automatically sync color palettes between Palettable and Figma color styles.</li>
        <li><span className="text-secondary-db-100">Design Tokens</span>: Keep your design tokens in sync across Waysorted and Figma variables.</li>
        <li><span className="text-secondary-db-100">Plugin Settings</span>: Your Waysorted plugin preferences carry over to Figma automatically.</li>
        <li><span className="text-secondary-db-100">Asset Libraries</span>: Access your saved assets and components from either platform.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Setting Up Sync</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Connect Account</span>: Link your Figma account in Settings &gt; Integrations &gt; Figma.</li>
        <li><span className="text-secondary-db-100">Select Projects</span>: Choose which Figma files and teams to sync with Waysorted.</li>
        <li><span className="text-secondary-db-100">Configure Options</span>: Set sync frequency and choose what data to synchronize.</li>
        <li><span className="text-secondary-db-100">Enable Auto-Sync</span>: Turn on automatic synchronization or trigger manual syncs as needed.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Troubleshooting Sync Issues</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        If sync isn&apos;t working, check your Figma connection status, ensure you have edit permissions on the target files, and verify your internet connection. Force a manual sync from Settings or reconnect your Figma account if issues persist.
      </p>
    </>
  );
}
