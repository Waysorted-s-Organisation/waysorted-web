export default function ProfileAndSettings() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Profile and Settings</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Customize your Waysorted experience by managing your profile information and adjusting platform settings to match your workflow preferences.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Managing Your Profile</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Profile Picture</span>: Upload a custom avatar or connect your Gravatar to personalize your account across the platform.</li>
        <li><span className="text-secondary-db-100">Display Name</span>: Set how your name appears to other users in the community and marketplace.</li>
        <li><span className="text-secondary-db-100">Bio and Links</span>: Add a short bio and portfolio links to showcase your work if you&apos;re a plugin creator.</li>
        <li><span className="text-secondary-db-100">Contact Information</span>: Update your email address and phone number for account recovery and notifications.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Account Settings</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Password Management</span>: Change your password or enable two-factor authentication for enhanced security.</li>
        <li><span className="text-secondary-db-100">Connected Accounts</span>: Manage linked accounts like Figma, Google, and other third-party services.</li>
        <li><span className="text-secondary-db-100">Session Management</span>: View active sessions and sign out from devices you no longer use.</li>
        <li><span className="text-secondary-db-100">Account Deletion</span>: Permanently delete your account and associated data if needed.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Preferences</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Theme</span>: Choose between light, dark, or system-based theme for the dashboard.</li>
        <li><span className="text-secondary-db-100">Notifications</span>: Configure email and in-app notification preferences for updates, credits, and community activity.</li>
        <li><span className="text-secondary-db-100">Language</span>: Select your preferred language for the interface.</li>
        <li><span className="text-secondary-db-100">Accessibility</span>: Enable accessibility features like reduced motion and high contrast modes.</li>
      </ul>
    </>
  );
}
