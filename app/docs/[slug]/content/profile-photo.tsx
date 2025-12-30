export default function ProfilePhoto() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Profile Photo</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Your profile photo appears across Waysorted, from dashboard calls to comments and our website.
            </p>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                <li>Uploads to PNG, JPG, or GIF (max 1MB)</li>
                <li>Automatically displayed in profile</li>
                <li>Remove any time by editing</li>
            </ul>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed mt-4">
                Tip: Use a face photo, it builds trust and personality.
            </p>
        </>
    );
}
