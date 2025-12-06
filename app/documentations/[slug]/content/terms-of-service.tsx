export default function TermsOfService() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Terms of Service</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Welcome to Waysorted. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before using our services.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Account Terms</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Eligibility</span>: You must be at least 13 years old to use Waysorted. Users under 18 need parental consent.</li>
        <li><span className="text-secondary-db-100">Account Security</span>: You are responsible for maintaining the security of your account credentials.</li>
        <li><span className="text-secondary-db-100">Accurate Information</span>: You must provide accurate and complete information during registration.</li>
        <li><span className="text-secondary-db-100">One Account</span>: Each user should maintain only one account unless explicitly authorized.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Acceptable Use</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Lawful Use</span>: Use Waysorted only for lawful purposes and in accordance with these terms.</li>
        <li><span className="text-secondary-db-100">No Abuse</span>: Do not attempt to disrupt, overload, or compromise our services or security.</li>
        <li><span className="text-secondary-db-100">Respect Others</span>: Do not harass, abuse, or harm other users through the platform.</li>
        <li><span className="text-secondary-db-100">Content Guidelines</span>: Uploaded content must not infringe on intellectual property rights.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Service Modifications</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        We reserve the right to modify, suspend, or discontinue any part of our services at any time. We will provide reasonable notice of significant changes. Continued use after changes constitutes acceptance of updated terms.
      </p>
    </>
  );
}
