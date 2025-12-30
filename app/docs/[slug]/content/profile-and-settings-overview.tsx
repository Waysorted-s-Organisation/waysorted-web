export default function ProfileAndSettingsOverview() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Profile and Settings Overview</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The Profile & Settings area is the control center for managing your Waysorted account. Here you can set your name, manage preferences, update notification settings, toggle beta features, and more.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                Key settings include:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Your display name: Profile icon, in-app calls, tip, General</li>
            </ul>
        </>
    );
}
