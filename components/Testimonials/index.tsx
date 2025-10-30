"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const testimonialsData = [
    {
        id: 0,
        content:
            "WaySorted has transformed the way I organize my design files. The intuitive interface and powerful features have saved me countless hours.",
        author: "Prashansa Pimpalkar",
        image: "/images/prashansa.svg",
        position: "Product Designer, HCL Healthcare",
    },
    {
        id: 1,
        content:
            "I can't imagine going back to my old workflow. WaySorted has made collaboration so much easier.",
        author: "John Doe",
        image: "/images/prashansa.svg",
        position: "UX Researcher, Google",
    },
    {
        id: 2,
        content:
            "The ability to find and reuse components has streamlined my design process significantly.",
        author: "Jane Smith",
        image: "/images/prashansa.svg",
        position: "UI Designer, Figma",
    },
    {
        id: 3,
        content:
            "WaySorted is a game changer for design systems. It's a must-have tool for any design team.",
        author: "Alice Johnson",
        image: "/images/prashansa.svg",
        position: "Design Lead, Adobe",
    },
    {
        id: 4,
        content:
            "I love how easy it is to keep my design files organized and accessible. WaySorted is fantastic!",
        author: "Bob Brown",
        image: "/images/prashansa.svg",
        position: "Visual Designer, Microsoft",
    },
];

export default function Testimonials() {
    const [activeIndex, setActiveIndex] = useState(0);
    const activeTestimonial = testimonialsData[activeIndex];

    // Auto slide every 4 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prevIndex) =>
                prevIndex === testimonialsData.length - 1 ? 0 : prevIndex + 1
            );
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    return (
        <section className="bg-mavens px-6 md:px-20 lg:px-32 py-12 mx-auto">
            {/* Heading Section */}
            <section className="w-full flex flex-col items-center justify-center text-center pt-11">
                <span className="inline-flex items-center text-center text-sm font-medium bg-white rounded-md">
                    <Image
                        src="/icons/mavens.svg"
                        alt="Mavens"
                        width={30}
                        height={30}
                        className="inline block p-1"
                    />
                    <span className="pl-1 pr-2 py-1 inline text-secondary-db-100">
                        Mavens
                    </span>
                </span>

                <h1 className="mt-4 mb-3 text-4xl font-semibold text-secondary-db-100">
                    Hear From Way{" "}
                    <span className="bg-tertiary-orange-500/12 rounded-lg text-tertiary-orange-500 px-4 py-1">
                        Mavens
                    </span>
                </h1>
                <p className="text-secondary-db-80 max-w-4xl mx-auto font-medium text-lg">
                    Reviewed by Figma users who&apos;ve experienced the Wayflow.
                </p>
            </section>

            {/* Main Testimonial */}
            <div className="py-12">
                <div className="bg-white py-11 px-6 max-w-3xl mx-auto flex flex-col items-center justify-center rounded-2xl outline outline-10 outline-tertiary-orange-500/6 transition-all duration-500">
                    <p className="text-secondary-db-100 p-4 text-center text-xl font-medium leading-relaxed">
                        {activeTestimonial.content}
                    </p>
                    <p className="text-secondary-db-100 mt-6 py-1 px-1.5 text-center text-sm font-medium bg-secondary-db-5 rounded-3xl">
                        {activeTestimonial.position}
                    </p>
                </div>
            </div>

            {/* Thumbnails */}
            <div className="flex flex-col items-center justify-center mt-6">
                <div className="flex items-center justify-center space-x-6">
                    {testimonialsData.map((testimonial, index) => (
                        <button
                            key={testimonial.id}
                            onClick={() => setActiveIndex(index)}
                            className={`relative w-16 h-16 rounded-2xl transition-all duration-500 cursor-pointer ${
                                activeIndex === index
                                    ? "scale-100 shadow-xl -mt-4 -translate-y-5"
                                    : "scale-100 opacity-70"
                            }`}
                        >
                            <Image
                                src={testimonial.image}
                                alt={testimonial.author}
                                width={50}
                                height={50}
                                className="w-full h-full object-cover rounded-2xl"
                            />
                            {activeIndex === index && (
                                <span className="absolute left-1/2  w-2 h-2 transform -translate-x-1/2 translate-y-2 bg-tertiary-orange-500 rounded-full"></span>
                            )}
                        </button>
                    ))}
                </div>
                {/* Position Below */}
                <p className="text-base text-secondary-db-100 mt-8 text-center font-semibold">
                    - {activeTestimonial.author}
                </p>
            </div>
        </section>
    );
}
