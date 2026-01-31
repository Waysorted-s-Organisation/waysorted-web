export default function ThirdPartyIntegrations() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Third-Party Integrations</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                To enhance workflow efficiency and create a truly unified design ecosystem, Waysorted is building a framework for robust integrations with key third-party services. Our approach is to establish a stable core platform first, followed by a strategic rollout of vetted integrations.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Current Integrations</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                At the time of our initial launch in October 2025, Waysorted did not feature any public-facing third-party integrations. This ensures we can focus on delivering a stable, high-performance, and secure core plugin suite as our foundation.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Future Integrations</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Building a connected ecosystem is a high priority in our development roadmap. The following integrations are planned for future releases:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li><span className="text-secondary-db-100 font-semibold">Google Fonts API</span>: A direct, server-side integration with the Google Fonts API will be implemented. This will enhance the upcoming tools by allowing for real-time font fetching, previewing, and suggesting of fonts without requiring you to download them locally first.</li>
                <li><span className="text-secondary-db-100 font-semibold">Cloud Storage Providers</span>: In line with our planned cloud asset management feature, we will integrate with major platforms like Google Drive and Dropbox. This will enable seamless import and export of design assets directly within the Waysorted environment.</li>
                <li><span className="text-secondary-db-100 font-semibold">Developer and Project Management Platforms</span>: To further streamline the design-to-handoff process, we are planning integrations with project management tools (e.g., Jira, Asana) and developer platforms (e.g., Storybook, GitHub). This will allow for the direct export of assets and comment summaries into development workflows.</li>
            </ul>

            <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
                Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
            </p>
        </>
    );
}
