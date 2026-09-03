export default function Overview() {
    return (
        <>
            <h1 className="text-2xl font-semibold text-secondary-db-100 mb-4">Overview</h1>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                This section provides reference information on how credits work in Waysorted, a multi-platform design tool ecosystem. Credits are designed as a universal, portable value system that can be used across multiple supported software platforms, starting with Figma and expanding to other tools over time.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                During the current beta phase, credits are unlimited, allowing full access to all available tools without usage restrictions. The credit system is active primarily for tracking, transparency, and future readiness, not enforcement.
            </p>

            <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Overview</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Credits in Waysorted act as a platform-wide usage layer, designed to work consistently across different software environments. Rather than being tied to a single tool like Figma, credits are intended to remain usable as Waysorted expands to support additional design and productivity platforms.
            </p>

            <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">In beta, the system is intentionally permissive:</h2>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
                <li>All tools are accessible</li>
                <li>Credits are unlimited</li>
                <li>No workflows are blocked</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                This allows us to observe real usage patterns, validate system performance, and design a fair and scalable model for future releases, without disrupting current users.
            </p>

            <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Earning Credits</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                In the current beta version, users do not need to earn credits, as usage is unlimited. Earning mechanisms such as onboarding rewards, referrals, or engagement-based credits may be introduced gradually in future releases.
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                When enabled, these mechanisms will apply universally across supported platforms, ensuring credits earned in one environment remain usable in others.
            </p>

            <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
                Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
            </p>
        </>
    );
}
