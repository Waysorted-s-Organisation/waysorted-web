export default function EarningCredits() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Earning Credits</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        This section explains the Waysorted credit system: how credits work, how to access them, and what to expect during the beta.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Accessing Your Credits Balance</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        To view credit-related information:
      </p>
      <ul className="list-decimal list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        <li>Log in to your Waysorted account at waysorted.com.</li>
        <li>From the top navigation, select your Account settings and open Credits Usage.</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Even during beta, this page shows usage indicators and system messages to help you understand how credits will function post-beta.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Initial Credits (Post-Beta)</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        <span className="text-secondary-db-100 font-semibold">Description:</span> After beta, initial credits may be granted upon first-time signup and platform authentication.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        <span className="text-secondary-db-100 font-semibold">Purpose:</span> To allow new users to explore core tools without friction while maintaining platform sustainability as Waysorted scales across multiple software ecosystems.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Note: Initial credit limits are not enforced during beta.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Referral Credits (Coming Later)</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Referral-based credits may be introduced in future phases to support community-driven growth. When launched, credits earned via referrals will be platform-agnostic, remaining valid across all supported software tools within Waysorted.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Details will be communicated clearly before activation.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Credit Expiry (Not Active in Beta)</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        During beta, credits do not expire.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        If expiry rules are introduced in the future, they will be designed to promote healthy usage and platform balance, with advance notice and transparent communication.
      </p>
      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
