export default function UpcomingTools() {
  return (
    <>
      <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Upcoming Tools</h2>
      <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
        Key features for upcoming tools in the Waysorted suite.
      </p>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Eraser Background Remover</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Primary Function</span>: One-click, AI-powered background removal from images.</li>
        <li><span className="text-secondary-db-100">Refinement Tools</span>: Includes manual &quot;Restore&quot; and &quot;Erase&quot; brushes with adjustable sizes for fine-tuning selections.</li>
        <li><span className="text-secondary-db-100">Preview</span>: Real-time preview of the isolated subject before finalizing the edit.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Font Pairing</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Core Engine</span>: AI-driven engine that suggests harmonious font pairings based on a selected heading font.</li>
        <li><span className="text-secondary-db-100">Filtering</span>: Options to filter suggestions by font style (e.g., Serif, Sans-serif) and weight.</li>
        <li><span className="text-secondary-db-100">Live Preview</span>: Instantly preview font combinations on sample text within the plugin.</li>
        <li><span className="text-secondary-db-100">Export</span>: Provides CSS code for the selected font pairing for easy web implementation.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Comment Summariser</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">AI Summarization</span>: Utilizes AI to generate concise summaries of comment threads in Figma files.</li>
        <li><span className="text-secondary-db-100">Filtering</span>: Allows users to filter comments by user, date range, or resolution status before summarization.</li>
        <li><span className="text-secondary-db-100">Export</span>: Summaries can be exported as text for use in reports or project management tools.</li>
      </ul>

      <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">GIF Exporter</h3>
      <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
        <li><span className="text-secondary-db-100">Frame Selection</span>: Users can select a sequence of frames to compile into an animated GIF.</li>
        <li><span className="text-secondary-db-100">Animation Settings</span>: Controls for animation speed (frame delay), loop count (including infinite loop), and frame order.</li>
        <li><span className="text-secondary-db-100">Quality Options</span>: Adjustable settings for output quality and file size optimization.</li>
        <li><span className="text-secondary-db-100">Live Preview</span>: A real-time preview of the final GIF animation before exporting.</li>
      </ul>
      <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
        Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
      </p>
    </>
  );
}
