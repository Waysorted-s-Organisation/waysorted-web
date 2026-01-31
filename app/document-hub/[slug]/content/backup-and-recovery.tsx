export default function BackupAndRecovery() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Backup and Recovery</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Data integrity and recovery are managed through a multi-layered approach that leverages both Figma&apos;s native capabilities and Waysorted&apos;s cloud infrastructure.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Design File Integrity</h3>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li><span className="text-secondary-db-100 font-semibold">Figma Version History</span>: All design modifications made using Waysorted plugins are treated as standard actions within Figma. As such, they are automatically captured by Figma&apos;s native Version History. You can restore previous states of your design file using Figma&apos;s standard recovery process. Waysorted does not interfere with this core functionality.</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Waysorted Account Data</h3>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li><span className="text-secondary-db-100 font-semibold">Cloud Backup</span>: Your user profile, subscription status, and custom configurations are securely backed up on our servers.</li>
                <li><span className="text-secondary-db-100 font-semibold">Recovery</span>: In the event of a local data loss or when moving to a new machine, simply logging back into the Waysorted plugin will automatically restore all your account settings and custom presets.</li>
            </ul>

            <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
                Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
            </p>
        </>
    );
}
