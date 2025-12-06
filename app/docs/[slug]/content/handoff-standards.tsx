export default function HandoffStandards() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Handoff Standards</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Effective design-to-development handoff is crucial for maintaining design integrity. Follow these standards to ensure smooth collaboration between designers and developers.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Documentation Requirements</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Specifications</span>: Include exact measurements, spacing values, and typography details for all elements.</li>
        <li><span className="text-secondary-db-100">Component States</span>: Document all interactive states—default, hover, active, disabled, and error.</li>
        <li><span className="text-secondary-db-100">Responsive Behavior</span>: Define how layouts adapt across breakpoints with clear rules.</li>
        <li><span className="text-secondary-db-100">Animation Specs</span>: Describe timing, easing, and transition details for all animations.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Asset Preparation</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Export Formats</span>: Provide assets in appropriate formats—SVG for icons, optimized PNG/WebP for images.</li>
        <li><span className="text-secondary-db-100">Resolution Variants</span>: Include @1x, @2x, and @3x versions for different screen densities.</li>
        <li><span className="text-secondary-db-100">Naming Conventions</span>: Use consistent, descriptive file names that match component names.</li>
        <li><span className="text-secondary-db-100">Design Tokens</span>: Export colors, typography, and spacing as design tokens for code implementation.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Communication Best Practices</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Schedule handoff meetings to walk through designs with developers. Use annotation tools to highlight important details, and maintain open channels for questions during implementation. Waysorted&apos;s export tools help automate asset preparation and token generation.
      </p>
    </>
  );
}
