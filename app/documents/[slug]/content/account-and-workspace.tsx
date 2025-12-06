export default function AccountAndWorkspace() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Profile and Settings</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Control your personal info, notification preferences, and security settings. Changes apply immediately, so confirm details before leaving the page.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">What you can update</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Identity</span>: Name, title, avatar, and contact email.</li>
        <li><span className="text-secondary-db-100">Preferences</span>: Language, time zone, and notification channels.</li>
        <li><span className="text-secondary-db-100">Security</span>: MFA, active sessions, and connected devices.</li>
        <li><span className="text-secondary-db-100">Privacy</span>: Manage data sharing and download your data on request.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Admin considerations</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        In SSO-enabled workspaces some fields sync from your identity provider. Contact an admin if edits are locked or you need elevated permissions.
      </p>
    </>
  );
}
