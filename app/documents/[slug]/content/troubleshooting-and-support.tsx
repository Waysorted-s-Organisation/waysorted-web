export default function TroubleshootingAndSupport() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Common Errors</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Identify frequent errors by code and message, then apply the recommended fix. Keep error logs handy for faster support.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Error categories</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Auth</span>: Token expiration, invalid credentials, and scope mismatches.</li>
        <li><span className="text-secondary-db-100">Sync</span>: Network timeouts, file conflicts, and missing permissions.</li>
        <li><span className="text-secondary-db-100">Validation</span>: Bad input, unsupported formats, and size limits.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Diagnostics</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Run built-in diagnostics to surface environment issues. Share results with support to speed resolution.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Diagnostic steps</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Run checks</span>: Open the diagnostic panel and initiate a full scan.</li>
        <li><span className="text-secondary-db-100">Review output</span>: Note warnings about network, storage, and plugins.</li>
        <li><span className="text-secondary-db-100">Export logs</span>: Download and attach to support tickets.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Contact Support</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Get help from the Waysorted team through chat, email, or scheduled calls. Include diagnostics and reproduction steps for faster turnaround.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How to reach us</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">In-app chat</span>: Use the widget for quick questions during business hours.</li>
        <li><span className="text-secondary-db-100">Email</span>: Send detailed requests to support@waysorted.com.</li>
        <li><span className="text-secondary-db-100">Calls</span>: Book time with a specialist for complex issues.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Bug Reporting</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Submit clear, reproducible reports so engineers can prioritize and fix faster. Good reports include steps, expected outcome, and actual result.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">What to include</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Steps</span>: List exact actions to reproduce the bug.</li>
        <li><span className="text-secondary-db-100">Expected</span>: Describe what should happen.</li>
        <li><span className="text-secondary-db-100">Actual</span>: Describe what happens instead.</li>
        <li><span className="text-secondary-db-100">Environment</span>: Include browser, OS, and plugin versions.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Request a Feature</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Suggest new capabilities through the feature board. Upvote existing ideas and add context so the team can prioritize effectively.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Best practices</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Search first</span>: See if the idea already exists and upvote it.</li>
        <li><span className="text-secondary-db-100">Be specific</span>: Describe the problem you want solved and why it matters.</li>
        <li><span className="text-secondary-db-100">Add examples</span>: Link to references or mockups if available.</li>
      </ul>
    </>
  );
}
