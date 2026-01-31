export default function Diagnostics() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Diagnostics</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Providing our support team with detailed diagnostic information is the most effective way to accelerate the resolution of your issue. Please gather the following before submitting a report:
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Environment Details</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100 font-semibold">Plugin Name &amp; Version</span>: Specify the exact Waysorted tool and its version number.</li>
        <li><span className="text-secondary-db-100 font-semibold">Figma Version</span>: Note whether you are using the Figma Desktop App (include version) or a web browser (include browser name and version).</li>
        <li><span className="text-secondary-db-100 font-semibold">Operating System</span>: Specify your OS (e.g., macOS Ventura 13.5, Windows 11).</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Replication Steps</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Provide a clear, numbered, step-by-step list of the actions that trigger the issue. This is the most critical piece of information.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Visual Evidence</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        A screenshot or, ideally, a short screen recording (screencast) of the issue occurring is extremely helpful.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Error Messages</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        If any error messages are displayed, copy and paste the exact text.
      </p>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
