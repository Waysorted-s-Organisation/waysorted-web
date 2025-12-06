export default function DesignStandards() {
  return (
    <>
      {/* Article headings included so TOC can map them */}
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Waysorted Principles</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted champions clarity, consistency, and speed. These principles guide how we ship features and how teams design within the platform.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Core tenets</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Clarity</span>: Make intent obvious with hierarchy and contrast.</li>
        <li><span className="text-secondary-db-100">Consistency</span>: Reuse components and tokens to reduce drift.</li>
        <li><span className="text-secondary-db-100">Velocity</span>: Prefer simple flows that minimize steps and errors.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Accessibility (WCAG)</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Build experiences that align with WCAG 2.1 AA. Use color contrast, keyboard support, and semantic structure to keep interfaces inclusive.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Key practices</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Contrast</span>: Validate text and interactive elements meet ratio targets.</li>
        <li><span className="text-secondary-db-100">Keyboard</span>: Ensure focus order is logical and visible.</li>
        <li><span className="text-secondary-db-100">Semantics</span>: Use proper headings, labels, and alt text for assistive tech.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">UI/UX Best Practices</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Apply consistent patterns for layout, interaction, and feedback. Reduce cognitive load so users accomplish tasks faster.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Patterns to follow</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Hierarchy</span>: Use spacing, typography, and color to signal priority.</li>
        <li><span className="text-secondary-db-100">Feedback</span>: Provide clear states for hover, focus, loading, and errors.</li>
        <li><span className="text-secondary-db-100">Simplicity</span>: Minimize steps and avoid unnecessary choices.</li>
      </ul>

      <h2 className="text-2xl font-semibold text-secondary-db-100 mt-16 mb-4">Handoff Standards</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Share specs that remove guesswork. Standardized tokens, assets, and annotations keep implementation accurate and fast.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">What to include</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Tokens</span>: Colors, typography, spacing, and radius values.</li>
        <li><span className="text-secondary-db-100">States</span>: Hover, focus, disabled, error, and loading references.</li>
        <li><span className="text-secondary-db-100">Assets</span>: Optimized exports with naming conventions and versions.</li>
      </ul>
    </>
  );
}
