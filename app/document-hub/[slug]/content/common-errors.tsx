export default function CommonErrors() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Common Errors</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        This section helps you resolve issues and get support while using Waysorted. We aim to provide clear, actionable steps to help you return to your workflow as quickly as possible.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Before contacting support, review the common errors and diagnostics below for faster resolution.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 italic">
        Note: Waysorted is currently in beta. While we strive for stability, occasional bugs or unexpected behavior may occur, similar to other beta-stage products.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">A Tool Fails to Load or Becomes Unresponsive</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        If a Waysorted tool fails to load or becomes unresponsive, first ensure that your internet connection is stable. Closing and reopening Figma completely often resolves temporary loading issues. If the problem continues, report the issue to the Waysorted team through a bug report panel in request a feature dashboard.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Figma Performance Appears Slower Than Expected</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Waysorted is designed as a unified tool suite to reduce the performance strain commonly caused by running multiple individual plugins. If you experience performance slowdowns, the issue is likely related to external factors within your Figma file.
      </p>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
        Files containing a large number of high-resolution images, complex vector paths, or heavy components can impact performance. As a diagnostic step, temporarily disabling other third-party plugins can help identify potential conflicts.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Exported Assets Are Incorrect or Incomplete</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        If an exported asset does not appear as expected, review the export settings within the specific Waysorted tool you are using. Ensure that all intended frames or layers were properly selected before exporting. In cases involving text or layout inconsistencies, confirm that all fonts used in the file are correctly loaded and available within your Figma environment.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">A Feature or Setting Appears Missing</h3>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        If a feature or setting seems unavailable, it may be due to changes or limitations within the current beta release. Some features may be temporarily disabled, renamed, or under iteration. We recommend reviewing recent product updates or release notes where applicable. Availability may also change as the platform evolves during beta.
      </p>

      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or submit feedback via Report a Bug.
      </p>
    </>
  );
}
