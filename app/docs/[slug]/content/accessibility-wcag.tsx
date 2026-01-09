export default function AccessibilityWcag() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Accessibility (WCAG)</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted is committed to creating accessible digital experiences. This guide covers WCAG compliance standards and how our tools help you build inclusive designs.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">WCAG Overview</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Perceivable</span>: Information must be presentable in ways all users can perceive, including text alternatives for images and captions for audio.</li>
        <li><span className="text-secondary-db-100">Operable</span>: Interface components must be operable via keyboard, with sufficient time for interactions, and without triggering seizures.</li>
        <li><span className="text-secondary-db-100">Understandable</span>: Content must be readable and predictable, with input assistance to prevent errors.</li>
        <li><span className="text-secondary-db-100">Robust</span>: Content must be compatible with current and future assistive technologies.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Compliance Levels</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Level A</span>: Minimum accessibility requirements. Essential for basic access.</li>
        <li><span className="text-secondary-db-100">Level AA</span>: Recommended standard for most websites. Required by many regulations.</li>
        <li><span className="text-secondary-db-100">Level AAA</span>: Highest level of accessibility. Not always achievable for all content types.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Waysorted Accessibility Tools</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Our tools include built-in accessibility checkers for color contrast, font sizing, touch targets, and more. Use Palettable&apos;s contrast checker and the Design Linter (coming soon) to validate your designs against WCAG standards automatically.
      </p>
    </>
  );
}
