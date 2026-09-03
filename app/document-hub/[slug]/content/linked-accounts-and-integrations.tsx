export default function LinkedAccountsAndIntegrations() {
    return (
        <>
            <h1 className="text-2xl font-semibold text-secondary-db-100 mb-4">Linked Accounts and Integrations</h1>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Connect third-party services to enable faster access and enhanced functionality.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
                Currently supported:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Google (Single Sign-On and integrations)</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
                Actions:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Link via secure authorization</li>
                <li>Unlink at any time from the same panel</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                All integrations follow Waysorted&apos;s Privacy Policy, and no data is shared without explicit consent.
            </p>
        </>
    );
}
