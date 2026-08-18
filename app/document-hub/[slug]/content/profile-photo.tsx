export default function ProfilePhoto() {
    return (
        <>
            <h1 className="text-2xl font-semibold text-secondary-db-100 mb-4">Profile Photo</h1>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Your profile photo appears across Waysorted in collaborations, comments, and the marketplace.
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li>Upload JPG, PNG, or GIF (max 5MB)</li>
                <li>Automatically cropped to a circle</li>
                <li>Remove anytime to revert to initials</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4 italic">
                Tip: Use a professional photo for public or creator profiles.
            </p>
        </>
    );
}
