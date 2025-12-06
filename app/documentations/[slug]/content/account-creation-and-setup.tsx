export default function AccountCreationAndSetup() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Account Creation and Setup</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Creating your Waysorted account is the first step to unlocking a powerful suite of design tools and plugins. This guide walks you through the registration process and initial setup to get you started quickly.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Creating Your Account</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Email Registration</span>: Sign up using your email address and create a secure password. You&apos;ll receive a verification email to confirm your account.</li>
        <li><span className="text-secondary-db-100">Social Login</span>: Alternatively, use Google or other social providers for quick one-click registration.</li>
        <li><span className="text-secondary-db-100">Profile Information</span>: Add your name, profile picture, and basic details to personalize your experience.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Initial Setup Steps</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Choose Your Role</span>: Select whether you&apos;re a designer, developer, or team lead to customize your dashboard experience.</li>
        <li><span className="text-secondary-db-100">Connect Design Tools</span>: Link your Figma account to enable seamless plugin integration.</li>
        <li><span className="text-secondary-db-100">Set Preferences</span>: Configure notification settings, theme preferences, and default workspace options.</li>
        <li><span className="text-secondary-db-100">Explore Onboarding</span>: Complete the interactive tutorial to familiarize yourself with key features.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Account Security</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        We recommend enabling two-factor authentication (2FA) for added security. Navigate to Settings &gt; Security to enable 2FA using your preferred authenticator app.
      </p>
    </>
  );
}
