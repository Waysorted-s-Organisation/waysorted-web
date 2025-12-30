export default function LinkedAccountsAndIntegrations() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Linked Accounts and Integrations</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Connect third-party apps to your account for a connected and streamlined workflow.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
                Currently supported:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Google (Sign-in, Sync contacts)</li>
            </ul>
        </>
    );
}
