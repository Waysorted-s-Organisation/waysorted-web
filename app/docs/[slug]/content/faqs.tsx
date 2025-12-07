export default function Faqs() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Frequently Asked Questions</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Find answers to the most common questions about Waysorted, its features, and how to make the most of the platform.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">General Questions</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">What is Waysorted?</span>: Waysorted is an all-in-one platform that bundles design plugins, offers a credit-based reward system, and provides a marketplace for discovering and sharing tools.</li>
        <li><span className="text-secondary-db-100">Is Waysorted free to use?</span>: Yes, Waysorted offers a freemium model with access to core features at no cost. Premium features and additional plugins are available through credits or subscriptions.</li>
        <li><span className="text-secondary-db-100">Which design tools are supported?</span>: Currently, Waysorted integrates with Figma, with plans to support additional platforms in the future.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Account and Billing</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">How do I reset my password?</span>: Click &quot;Forgot Password&quot; on the login page and follow the email instructions to reset your credentials.</li>
        <li><span className="text-secondary-db-100">Can I change my email address?</span>: Yes, navigate to Settings &gt; Profile to update your email. You&apos;ll need to verify the new address.</li>
        <li><span className="text-secondary-db-100">How are credits purchased?</span>: Credits can be purchased through the Credits section in your dashboard using various payment methods.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Technical Support</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">The plugin isn&apos;t loading</span>: Try refreshing Figma, checking your internet connection, or reinstalling the plugin from the Figma Community.</li>
        <li><span className="text-secondary-db-100">My credits aren&apos;t showing</span>: Ensure you&apos;re logged into the correct account. If the issue persists, contact support.</li>
        <li><span className="text-secondary-db-100">Where can I get help?</span>: Visit our Support page or email support@waysorted.com for assistance.</li>
      </ul>
    </>
  );
}
