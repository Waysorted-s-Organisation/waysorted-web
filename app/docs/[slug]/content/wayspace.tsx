import Image from "next/image";

export default function Wayspace() {
    return (
        <>
            <h2 className="text-2xl font-semibold text-secondary-db-100 mb-4">Wayspace</h2>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Your personalized hub for tools. It&apos;s where you can organize, manage, and instantly access all your essential plugins in a clutter-free, intuitive interface, enhanced by our first-of-its-kind Liquid Glass Mode UI, Shrink UI feature and more.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Wayspace-Image-1.png"
                    alt="Wayspace Overview"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Wayspace Overview</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Wayspace is the central command center of your creative universe. It&apos;s a customizable hub designed to eliminate the chaos of managing countless plugins and tools by putting everything you need into one intuitive, organized space. From here, you can instantly access your essential toolkit, streamline your workflow, and manage your entire design process without ever leaving the canvas. It&apos;s the core of the Waysorted experience — your ultimate playground for a frictionless, productive workflow.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Wayspace-Image-2.png"
                    alt="Wayspace Hub"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>

            <h3 className="text-xl font-semibold text-secondary-db-100 mt-10 mb-4">Minimized UI</h3>
            <p className="text-secondary-db-70 font-regular text-xl leading-relaxed">
                Our intuitive shrink feature transforms the full plugin interface into a compact, non-intrusive toolbar. This allows you to reclaim your screen real estate and keep your essential tools accessible at all times, ensuring nothing gets in the way of your creative flow.
            </p>
            <div className="my-6 rounded-xl overflow-hidden">
                <Image
                    src="/images/docs/Wayspace-Image-3.png"
                    alt="Minimized UI"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-xl"
                />
            </div>
        </>
    );
}
