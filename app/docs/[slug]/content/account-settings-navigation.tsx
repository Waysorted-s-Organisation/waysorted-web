export default function AccountSettingsNavigation() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Account Settings Navigation</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Use the sidebar to navigate different account areas:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li><span className="text-secondary-db-100">General:</span> Profile settings and name preferences</li>
                <li><span className="text-secondary-db-100">Linked Account:</span> Connecting third-party services (e.g. Google)</li>
                <li><span className="text-secondary-db-100">Credits page:</span> View credit balance, usage history, and top-ups</li>
                <li><span className="text-secondary-db-100">Workspaces:</span> Manage spaces and teams you&apos;re part of</li>
                <li><span className="text-secondary-db-100">Notifications:</span> Email and in-app alert settings</li>
                <li><span className="text-secondary-db-100">Integrations:</span> Manage linked services</li>
                <li><span className="text-secondary-db-100">Beta Features:</span> Try experimental features</li>
            </ul>
        </>
    );
}
