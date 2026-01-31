export default function FigmaSync() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Figma Sync</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The core of Waysorted is its deep, native integration with Figma. This is not a separate application but a unified suite of plugins that operates directly within the Figma environment.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Architecture</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The integration is built on Figma&apos;s public Plugin API, ensuring real-time communication between the Waysorted plugins and the Figma canvas.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Data Flow</h3>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li><span className="text-secondary-db-100 font-semibold">Canvas Operations</span>: Plugin actions (e.g., generating palettes, converting units, exporting assets) are executed client-side and manipulate the Figma canvas objects directly. This ensures maximum performance and immediate visual feedback.</li>
                <li><span className="text-secondary-db-100 font-semibold">Account Synchronization</span>: Your Waysorted user account data&mdash;including subscription tier, feature access, and tool-specific credits&mdash;is securely synced from our servers to the plugin interface upon login. This ensures your settings and permissions are consistent across all sessions and devices.</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Authentication</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The connection is authenticated via a secure token exchange upon logging into your Waysorted account within the Figma plugin. This token authorizes access to your subscription-level features and settings.
            </p>

            <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
                Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
            </p>
        </>
    );
}
