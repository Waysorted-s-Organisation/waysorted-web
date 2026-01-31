export default function RequestAFeature() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Request a Feature or Plugin</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                If you have an idea for a new plugin, an improvement to an existing tool, or a new platform feature, we want to hear it. This process ensures our ecosystem grows in a direction that provides maximum value to our users.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How to Submit a Request</h3>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
                <li>Navigate to the &quot;Request a Feature&quot; section within your Waysorted profile icon after signing in.</li>
                <li>Complete the form with a clear title and a detailed description of your idea. Explain the problem it solves and how it would improve your design workflow.</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How We Prioritize Suggestions</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                All submissions are reviewed by our product team. Submissions are prioritized based on:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li><span className="text-secondary-db-100">Community Upvotes</span>: The number of other users who support the idea.</li>
                <li><span className="text-secondary-db-100">Impact</span>: The potential for the feature to solve significant pain points, like compatibility issues or performance slowdowns.</li>
                <li><span className="text-secondary-db-100">Alignment</span>: How the suggestion aligns with our mission to create a unified and efficient design powerhouse.</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Tracking Your Suggestion&apos;s Status</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                You can track the status of your suggestion and other community requests on our public feedback board. Statuses typically include:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li><span className="text-secondary-db-100">Planned</span>: The feature has been approved and added to our development roadmap.</li>
                <li><span className="text-secondary-db-100">In Progress</span>: Our team has begun active development.</li>
                <li><span className="text-secondary-db-100">Released</span>: The feature is now live in the Waysorted platform.</li>
                <li><span className="text-secondary-db-100">Not Done</span>: Not considered under present scenario, may get included in future.</li>
            </ul>

            <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
                Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
            </p>
        </>
    );
}
