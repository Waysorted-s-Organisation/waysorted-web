export default function PdfExporter() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">PDF Exporter Specifications</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                A streamlined utility for converting Figma frames into high-quality, multi-page PDF documents directly within the design environment.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Export Engine</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Frame-to-PDF conversion, no third-party applications required.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Frame Selection</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Supports single-frame, multi-frame, and full-page project exports.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Element Fidelity</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Preserves vector quality, text formatting, and image resolution during conversion to CMYK.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Output Options</h3>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed">
                <li><span className="text-secondary-db-100">Multi Merge Files</span>: Combine multiple frames into groups which will make your export a merged export. You can create multiple groups and export multiple merged documents from selected frames.</li>
                <li><span className="text-secondary-db-100">File Naming</span>: Customizable output file names.</li>
            </ul>

            <p className="text-secondary-db-70 font-regular text-sm leading-relaxed mt-6">
                Last updated: December 2025. Need help? Contact info@waysorted.com or use Report a Bug from your dashboard.
            </p>
        </>
    );
}
