import Image from "next/image";

export default function MainUI() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Main UI</h2>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Top Bar</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Primary navigation categories, and core application settings.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Main-UI-Image-01.png"
                    alt="Top Bar UI"
                    width={600}
                    height={300}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Search Bar</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li><span className="text-secondary-db-100">Appearance:</span> An input field with a search icon on the left and a placeholder for text input.</li>
                <li><span className="text-secondary-db-100">Function:</span> Allows users to quickly find specific tools, features, or help documentation within the plugin.</li>
            </ul>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">WaySpace & Tools Toggle</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li><span className="text-secondary-db-100">Appearance:</span> Two distinct buttons, Wayspace and Tools, indicating the UI user is on.</li>
                <li><span className="text-secondary-db-100">Function:</span> Allows users to switch between their Personalised Wayspace and all the tools Waysorted provides.</li>
            </ul>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Main-UI-Image-2.png"
                    alt="WaySpace and Tools Toggle"
                    width={600}
                    height={300}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">UI Style Toggle (Default / Glass)</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li><span className="text-secondary-db-100">Appearance:</span> Two distinct buttons, Default and Glass, indicating different UI visual styles. Glass is typically a translucent, modern look.</li>
                <li><span className="text-secondary-db-100">Function:</span> Allows users to switch between a standard opaque plugin UI and a &quot;Liquid Glass Mode&quot; for an immersive experience.</li>
            </ul>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Left Panel (Credits & Account)</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Manages user credits, which unlocks premium features & tools.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Main-UI-Image-3.png"
                    alt="Left Panel Credits"
                    width={600}
                    height={300}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">&quot;Your credits&quot; Section</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li><span className="text-secondary-db-100">Appearance:</span> A card element with a wallet/credit icon.</li>
                <li><span className="text-secondary-db-100">Function:</span> A view of credit usage, and ability to purchase more.</li>
            </ul>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Credit Balance & Status</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li><span className="text-secondary-db-100">Appearance:</span> Displays the numerical amount of credits left with a button/label depending on the credit status.</li>
                <li><span className="text-secondary-db-100">Function:</span> Informs the user of their remaining credit balance. The Active button confirms the credits are usable. The Low button confirms the credits are low. The No credits left button shows that credit is exhausted.</li>
            </ul>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Main-UI-Image-4.png"
                    alt="Credit Status"
                    width={600}
                    height={300}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">&quot;Get more credits&quot; Button</h4>
            <ul className="list-disc list-inside text-secondary-db-70 font-regular text-xl leading-relaxed mt-2">
                <li><span className="text-secondary-db-100">Appearance:</span> A secondary action button.</li>
                <li><span className="text-secondary-db-100">Function:</span> Directs users to a page where they can purchase additional credits.</li>
            </ul>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Main-UI-Image-5.png"
                    alt="Get More Credits Button"
                    width={600}
                    height={300}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Central Panel (Wayspace - Customizable Hub)</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Acts as the personalized dashboard where users can curate and access their favorite tools. Checkout Wayspace docs for more info.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Main-UI-Image-6.png"
                    alt="Central Panel Wayspace"
                    width={600}
                    height={300}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Right Panel (Engagement & Communication)</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Provides quick access to engagement features, community, and important updates.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Main-UI-Image-7.png"
                    alt="Right Panel"
                    width={600}
                    height={300}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h4 className="text-lg font-semibold text-secondary-db-100 mt-6 mb-2">Way Challenge</h4>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                The flagship game of Waysorted&apos;s Figma plugin.
            </p>
        </>
    );
}
