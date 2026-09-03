export default function ProfileAndSettings() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-secondary-db-100 mb-4">Profile and Settings</h1>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        This section explains how to manage your Waysorted account, profile, subscriptions, integrations, and preferences. These settings help you personalize your workspace, track credits, manage plans, and control how you interact with the Waysorted ecosystem within Figma.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        For guided walkthroughs and practical tutorials, visit the Learning Hub.
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Account Settings Navigation</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Use the left sidebar to manage different account areas:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        <li><span className="text-secondary-db-100">General</span> – Profile and basic account information</li>
        <li><span className="text-secondary-db-100">Refer &amp; Earn</span> – Earn credits by referrals (coming soon)</li>
        <li><span className="text-secondary-db-100">Credits Usage</span> – View credit balance, usage history, and recharges</li>
        <li><span className="text-secondary-db-100">Subscription</span> – Manage plans, billing, and add-ons</li>
        <li><span className="text-secondary-db-100">Notifications</span> – Control email and in-app alerts</li>
        <li><span className="text-secondary-db-100">Integrations</span> – Manage linked services</li>
        <li><span className="text-secondary-db-100">Beta Features</span> – Access early and experimental tools</li>
      </ul>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Profile &amp; Settings Overview</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        The Profile &amp; Settings area is the central place to manage your Waysorted account. Here you can update your profile, control preferences, manage credits and subscriptions, configure notifications and integrations, and access beta features.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        All changes are saved automatically and synced across your devices.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Access: Top navigation → Profile icon → Account settings → General
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Profile Details</h2>

      <h2 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Profile Photo</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Your profile photo appears across Waysorted in collaborations, comments, and the marketplace.
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        <li>Upload JPG, PNG, or GIF (max 5MB)</li>
        <li>Automatically cropped to a circle</li>
        <li>Remove anytime to revert to initials</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-2 italic">
        Tip: Use a professional photo for public or creator profiles.
      </p>

      <h2 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Name</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Your display name is visible across the platform.
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        <li>Maximum 50 characters</li>
        <li>Alphabetic characters only</li>
        <li>Updates apply instantly</li>
      </ul>

      <h2 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Email</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Your primary email is used for login, notifications, billing, and recovery.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        To update:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        <li>Edit your email address</li>
        <li>Verify via confirmation link</li>
        <li>Existing email remains active until verification is complete</li>
      </ul>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Linked Accounts &amp; Integrations</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Connect third-party services to enable faster access and enhanced functionality.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
        Currently supported:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        <li>Google (Single Sign-On and integrations)</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Actions:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        <li>Link via secure authorization</li>
        <li>Unlink at any time from the same panel</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        All integrations follow Waysorted&apos;s Privacy Policy, and no data is shared without explicit consent.
      </p>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Notifications Preferences</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Customize how you receive updates from Waysorted.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
        Notification types include:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        <li>Product updates and feature releases</li>
        <li>New plugins, rewards, and credits</li>
        <li>Surveys, raffles, and announcements</li>
        <li>Creator and marketplace alerts</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Controls: Enable or disable non-essential notifications from Account settings. Transactional emails (security, billing, password recovery) are always active.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
        Troubleshooting tips:
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
        <li>Check spam or promotions folders</li>
        <li>Ensure your email address is verified</li>
      </ul>

      <h2 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Beta Features</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Beta features allow early access to upcoming tools and experiments.
      </p>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        <li>Optional opt-in</li>
        <li>Features may change or be removed</li>
        <li>Availability depends on account status (e.g., Early Bird access)</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
      </p>
    </>
  );
}
