import Image from "next/image";

export default function AccountAndWorkspace() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Account and Workspace</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mb-6">
                This section covers your personal account management, workspace settings, integrations, and data preferences within Waysorted.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Account Settings Navigation</h3>
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

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Profile & Settings Overview</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The Profile & Settings area is the control center for managing your Waysorted account. Here you can set your name, manage preferences, update notification settings, toggle beta features, and more.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                Key settings include:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Your display name: Profile icon, in-app calls, tip, General</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Profile Photo</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Your profile photo appears across Waysorted, from dashboard calls to comments and our website.
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li>Uploads to PNG, JPG, or GIF (max 1MB)</li>
                <li>Automatically displayed in profile</li>
                <li>Remove any time by editing</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                Tip: Use a face photo, it builds trust and personality.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Linked Accounts & Integrations</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Connect third-party apps to your account for a connected and streamlined workflow.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
                Currently supported:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Google (Sign-in, Sync contacts)</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Notifications Preferences</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Control how you receive notifications. Visit Notifications settings to:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li>Set preference per module</li>
                <li>Manage global and per-product settings</li>
                <li>Toggle for marketing and promotional emails</li>
                <li>Control push and SMS settings if available</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Beta Features</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Beta features give early access to upcoming elements and documentation.
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li>Visit the &quot;Beta&quot; section in the main menu</li>
                <li>Toggle early preview of integrated content</li>
            </ul>
        </>
    );
}
