export default function NotificationsPreferences() {
    return (
        <>
            <h1 className="text-2xl font-semibold text-secondary-db-100 mb-4">Notifications Preferences</h1>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Control how you receive notifications. Visit Notifications settings to:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li>Set preference per module</li>
                <li>Manage global and per-product settings</li>
                <li>Toggle for marketing and promotional emails</li>
                <li>Control push and SMS settings if available</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                Controls: Enable or disable non-essential notifications from Account settings. Transactional emails (security, billing, password recovery) are always active.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
                Troubleshooting tips:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Check spam or promotions folders</li>
                <li>Ensure your email address is verified</li>
            </ul>
        </>
    );
}
