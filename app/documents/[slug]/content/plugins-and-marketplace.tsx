export default function PluginsAndMarketplace() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Searching and Browsing Plugins</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Use categories, tags, and saved searches to discover plugins quickly. Review details before installing to keep your workspace secure.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Search and filter</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Filters</span>: Narrow by category, compatibility, popularity, and recency.</li>
        <li><span className="text-secondary-db-100">Tags</span>: Combine keywords and tags to surface niche tools faster.</li>
        <li><span className="text-secondary-db-100">Saved searches</span>: Store frequent queries to revisit curated lists.</li>
        <li><span className="text-secondary-db-100">Permissions</span>: Check requested scopes before approving installs.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Creator Guidelines</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Follow these standards to submit plugins that are secure, performant, and easy for teams to adopt. Clear documentation and minimal permissions help reviewers approve faster.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Submission checklist</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Security</span>: Request only necessary scopes and avoid hard-coded secrets.</li>
        <li><span className="text-secondary-db-100">Performance</span>: Optimize assets, minimize network calls, and handle errors gracefully.</li>
        <li><span className="text-secondary-db-100">Documentation</span>: Include setup steps, usage notes, and known limitations.</li>
        <li><span className="text-secondary-db-100">Support</span>: Provide a contact email and expected response window.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Ratings and Reviews</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Ratings and reviews help users choose reliable plugins and guide creators on improvements. Encourage honest feedback and respond to issues quickly.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">How ratings work</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Scoring</span>: Users score plugins on stability, usefulness, and support quality.</li>
        <li><span className="text-secondary-db-100">Verification</span>: Reviews from active workspaces carry more weight.</li>
        <li><span className="text-secondary-db-100">Flagging</span>: Report spam or abuse to keep the marketplace trustworthy.</li>
      </ul>
    </>
  );
}
