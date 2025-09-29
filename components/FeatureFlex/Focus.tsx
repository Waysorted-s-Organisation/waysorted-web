import { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function Focus() {

    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!containerRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            const container = containerRef.current!;
            const cards = gsap.utils.toArray<HTMLElement>(".scroll-card");

            // Initial state for all cards
            gsap.set(cards, { scale: 0.9, opacity: 0.7 });

            // Batch animations as cards enter/leave the container's viewport
            ScrollTrigger.batch(cards, {
                scroller: container, // use the scrollable container instead of window
                start: "top 80%",
                end: "bottom 20%",
                onEnter: (batch) =>
                    gsap.to(batch, {
                        scale: 1,
                        opacity: 1,
                        duration: 0.3,
                        stagger: 0.05,
                        overwrite: "auto",
                    }),
                onLeave: (batch) =>
                    gsap.to(batch, {
                        scale: 0.9,
                        opacity: 0.7,
                        duration: 0.3,
                        overwrite: "auto",
                    }),
                onEnterBack: (batch) =>
                    gsap.to(batch, {
                        scale: 1,
                        opacity: 1,
                        duration: 0.3,
                        stagger: 0.05,
                        overwrite: "auto",
                    }),
                onLeaveBack: (batch) =>
                    gsap.to(batch, {
                        scale: 0.9,
                        opacity: 0.7,
                        duration: 0.3,
                        overwrite: "auto",
                    }),
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (


        <div className="w-[277px] h-[591px] rounded-2xl shadow border border-gray-100 text-center flex flex-col">
            {/* Scrollable card list */}
            <div
                ref={containerRef}
                className="relative h-[600px] p-6 overflow-y-scroll snap-y snap-mandatory no-scrollbar white-bg-dots"
            >
                {/* Top blur overlay */}
                <div className="pointer-events-none absolute top-0 left-0 w-full h-10 bg-gradient-to-b from-white/90 via-white/40 to-transparent z-10"></div>

                {/* Cards */}
                <div className="flex-1 space-y-6 py-5">
                    {[
                        "PDF Exporter Pro",
                        "Unit Converter",
                        "Color Palettable",
                        "Quick Notes",
                        "AI Assistant",
                        "PDF Exporter Pro",
                        "Unit Converter",
                        "Color Palettable",
                        "Quick Notes",
                        "AI Assistant",
                    ].map((title, i) => (
                        <div
                            key={i}
                            className="scroll-card snap-center bg-white rounded-xl shadow p-6 will-change-transform"
                        >
                            <h4 className="font-semibold text-gray-900">{title}</h4>
                            <p className="text-gray-600 text-sm">
                                Lorem ipsum dolor sit amet.
                            </p>
                        </div>
                    ))}
                </div>

                {/* Bottom blur overlay */}
                <div className="pointer-events-none absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-white/90 via-white/40 to-transparent z-10"></div>
            </div>

            <div className="bg-white mt-3 flex flex-col items-start p-4 rounded-xl shadow">
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    30% More Focus.
                </h3>
                <h3 className="text-lg font-bold text-gray-900 leading-snug">
                    One Unified Toolset.
                </h3>
                <p className="text-gray-600 text-sm leading-snug mt-2">
                    Streamline your workflow with everything you need in one place.
                </p>
            </div>
        </div>

    );
}