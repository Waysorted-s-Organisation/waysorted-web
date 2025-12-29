export default function Faqs() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Frequently Asked Questions</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Find answers to the most common questions about Waysorted, its features, and how to make the most of the platform.
      </p>



      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">General FAQs</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 space-y-6">
        <li>
          <span className="text-secondary-db-100 font-semibold">What is Waysorted?</span>
          <div className="mt-2">Waysorted unifies essential design tools into one place, so you spend less time switching between plugins and tabs. By reducing tool juggling, it helps teams work faster, stay focused, and avoid unnecessary costs from managing multiple tools.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">How do I create an account?</span>
          <div className="mt-2">Sign up at waysorted.com/signup with your email or Google account, verify, and set up your profile.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">Is Waysorted free?</span>
          <div className="mt-2">Open the Waysorted Figma plugin to start using the tools available during the beta. All current features are accessible for testing and feedback. A credit-based system for premium features will be introduced in a future release.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">How does Waysorted integrate with Figma?</span>
          <div className="mt-2">Unlike individual plugins or scattered tool sources, Waysorted brings essential tools together in one unified suite. This reduces compatibility issues, performance strain, scattered support, and the cost of managing multiple subscriptions, so teams work more smoothly and efficiently.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">What plugins are available at Beta launch?</span>
          <div className="mt-2">Waysorted currently includes four core tools for color management, PDF export, file importing, and unit conversion. More tools are planned, including Way AI and additional utilities designed to further simplify and streamline creative workflows.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">Can I suggest new tools?</span>
          <div className="mt-2">Yes, through request a feature; submit ideas or plugins for community review.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">Is Waysorted secure?</span>
          <div className="mt-2">Yes, with secure integrations, data processing under Privacy Policy, and no third-party sharing without consent.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">What if I encounter issues?</span>
          <div className="mt-2">Check the troubleshooting section in the documentation or contact our support team at info@waysorted.com. Support is available 24/7.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">How do I upgrade my subscription?</span>
          <div className="mt-2">From the &quot;Account Settings&quot; &gt; Subscription section, select a plan and complete payment.</div>
        </li>
        <li>
          <span className="text-secondary-db-100 font-semibold">Where can I learn more?</span>
          <div className="mt-2">Visit the Learning Hub for tutorials and advanced guides for each tool.</div>
        </li>
      </ul>

      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-6">
        For additional FAQs, see the full Troubleshooting and Support section.
      </p>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
      </p>
    </>
  );
}
