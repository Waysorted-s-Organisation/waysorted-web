export default function UiUxBestPractices() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">UI/UX Best Practices</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Follow these industry-standard best practices to create intuitive, efficient, and delightful user experiences in your design projects.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">User Interface Guidelines</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Visual Hierarchy</span>: Use size, color, and spacing to guide users&apos; attention to important elements first.</li>
        <li><span className="text-secondary-db-100">Consistent Patterns</span>: Use familiar UI patterns so users can predict how elements behave.</li>
        <li><span className="text-secondary-db-100">Responsive Design</span>: Ensure layouts adapt gracefully to all screen sizes and orientations.</li>
        <li><span className="text-secondary-db-100">Touch-Friendly Targets</span>: Make interactive elements at least 44x44 pixels for comfortable tapping.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">User Experience Principles</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Reduce Cognitive Load</span>: Present only necessary information and actions to avoid overwhelming users.</li>
        <li><span className="text-secondary-db-100">Provide Feedback</span>: Always acknowledge user actions with visual, auditory, or haptic responses.</li>
        <li><span className="text-secondary-db-100">Error Prevention</span>: Design interfaces that prevent errors rather than just reporting them.</li>
        <li><span className="text-secondary-db-100">Progressive Disclosure</span>: Show basic features first, revealing advanced options as needed.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Testing and Iteration</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Great UX comes from continuous testing and refinement. Conduct usability tests with real users, analyze behavior data, and iterate on designs based on feedback. Use Waysorted&apos;s tools to maintain consistency while experimenting with improvements.
      </p>
    </>
  );
}
