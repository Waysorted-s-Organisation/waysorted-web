export default function RequestAFeature() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Request a Feature</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Have an idea that would make Waysorted better? We love hearing from our community. Feature requests help shape our product roadmap and priorities.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Submitting a Request</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Feature Portal</span>: Visit our feature request portal to submit and vote on ideas.</li>
        <li><span className="text-secondary-db-100">In-App Feedback</span>: Use the feedback button in the dashboard to submit quick suggestions.</li>
        <li><span className="text-secondary-db-100">Community Forum</span>: Discuss feature ideas with other users to refine and build support.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Writing Effective Requests</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Problem Statement</span>: Describe the challenge you&apos;re facing that this feature would solve.</li>
        <li><span className="text-secondary-db-100">Proposed Solution</span>: Explain your ideal implementation of the feature.</li>
        <li><span className="text-secondary-db-100">Use Cases</span>: Provide specific scenarios where this feature would be valuable.</li>
        <li><span className="text-secondary-db-100">Alternatives</span>: Mention any workarounds you currently use.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">What Happens Next</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Our product team reviews all feature requests regularly. Popular requests with high community votes are prioritized in our roadmap. You&apos;ll be notified when your requested feature is planned, in development, or released.
      </p>
    </>
  );
}
