export default function SupportedPlatforms() {
    return (
        <>
            <h1 className="text-2xl font-semibold text-secondary-db-100 mb-4">Supported Platforms</h1>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Waysorted is currently available on:
            </p>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
                Currently supported:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>Design Tool: Figma (requires login)</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 font-semibold text-secondary-db-100">
                Coming Soon:
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li>OS Support: Mac, Windows, and Linux. All Systems cross-platform browser support</li>
            </ul>
        </>
    );
}
