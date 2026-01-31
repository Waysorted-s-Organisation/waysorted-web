export default function AccountCreationAndSetup() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Account Creation and Setup</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Creating a Waysorted account is straightforward and integrates seamlessly with your design workflow. Creating an account supports profile customization, linked services, and notification preferences.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Creating an Account</h3>
      <ul className="list-decimal list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li>Visit waysorted.com and click &quot;Sign Up&quot;.</li>
        <li>Enter your email address and create a password, or sign up via linked accounts (e.g., Google).</li>
        <li>Verify your email through the confirmation link sent to your inbox.</li>
        <li>Upon first login, you&apos;ll be directed to the &quot;My Profile&quot; page for initial setup.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Profile Setup</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Refer to the &quot;General&quot; for customization:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        <li><span className="text-secondary-db-100">Profile Details</span>: Update your name, email, and profile photo (e.g., upload or change via &quot;Change Photo&quot; button; remove if needed).</li>
        <li><span className="text-secondary-db-100">Linked Accounts</span>: Connect services like Google for seamless login and integrations.</li>
        <li><span className="text-secondary-db-100">Notifications</span>: Opt in/out of newsletters, updates, promotions, surveys, raffles, and product news. Based on legitimate interest, data is processed under our Privacy Policy; EU users can opt out without disclosure to third parties.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Quick Integration with Figma</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted works as a unified plugin inside Figma, giving you access to multiple tools from a single interface within your design workspace.
      </p>

      <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Accessing Waysorted in Figma</h4>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li>Open Figma and launch the Waysorted plugin from your plugins panel</li>
        <li>Sign in to your Waysorted account when prompted</li>
        <li>Once authenticated, all available Waysorted tools become accessible inside Figma Waysorted.</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        No separate installation is required for individual tools, and access is managed through your Waysorted account.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Compatibility and Tips</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted is compatible with the latest supported versions of Figma and is designed to run as a unified toolset to minimize plugin overhead. If you experience issues, verify Figma permissions, restart the application, or contact support for assistance.
      </p>
      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
      </p>
    </>
  );
}
