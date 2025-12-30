import Image from "next/image";

export default function OtherFeatures() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Other Features</h2>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">All Tools</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                All Waysorted tools are available in this interface. Users can find their preferred tools, mark them as favorites for quick access in Wayspace, and explore additional tools using the categorized tags.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Other-feature-Image-1.png"
                    alt="All Tools Interface"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Resources</h3>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Other-feature-Image-2.png"
                    alt="Resources Panel"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Help Center</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Find answers to your questions and learn how to use our tools with our comprehensive guides and tutorials.
            </p>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Report a Bug</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Help us improve by reporting any issues or unexpected behavior you encounter. Your feedback is crucial to our success.
            </p>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Request a Feature</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Share your ideas and suggestions. Help us build the features you need most to make your workflow even better.
            </p>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Join Discord</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Connect with our team and other creators. Join the conversation, get support, and share your work in our community.
            </p>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">User Profile</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The User Profile section allows users to view their account details, including their name and email address. From here, users can quickly request new features and explore available premium plans. This section also provides easy access to support and social links for staying connected with Waysorted.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Other-feature-Image-3.png"
                    alt="User Profile"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>
        </>
    );
}
