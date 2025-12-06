export default function BugReporting() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Bug Reporting</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Found a bug? Help us improve Waysorted by reporting issues effectively. Good bug reports help our team identify and fix problems quickly.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How to Report a Bug</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">In-App Reporter</span>: Use the bug icon in the bottom-right corner of the dashboard to submit reports directly.</li>
        <li><span className="text-secondary-db-100">Support Portal</span>: Submit detailed bug reports through our support portal with file attachments.</li>
        <li><span className="text-secondary-db-100">GitHub Issues</span>: For technical users, report bugs on our public GitHub repository.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">What to Include</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Description</span>: Clear, concise description of what went wrong.</li>
        <li><span className="text-secondary-db-100">Steps to Reproduce</span>: Exact steps to recreate the bug, numbered in order.</li>
        <li><span className="text-secondary-db-100">Expected vs Actual</span>: What should happen versus what actually happens.</li>
        <li><span className="text-secondary-db-100">Environment</span>: Browser, OS, Figma version, and Waysorted version.</li>
        <li><span className="text-secondary-db-100">Screenshots/Videos</span>: Visual evidence helps tremendously in understanding the issue.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Bug Bounty Program</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        We reward users who discover and report security vulnerabilities. Visit our security page for details on our responsible disclosure policy and bounty rewards.
      </p>
    </>
  );
}
