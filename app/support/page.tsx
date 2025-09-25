"use client";
import Image from "next/image";
import ContactForm from "./components/ContactForm";
import JoinCommunity from "@/components/JoinCommunity";
import FAQ from "./components/FAQs";
import {useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SupportPage() {
    const { showBanner, setShowBanner } = useBanner();
    return (
        <>
        <main
        className={`min-h-screen bg-white transition-all duration-300 ${
          showBanner ? "pt-24" : "pt-16"
        }`}
        >
    <Header showBanner={showBanner} setShowBanner={setShowBanner} />
            {/* Support Section */}
            <section className="w-full bg-white flex flex-col items-center justify-center text-center py-16">
                {/* Badge */}
                <span className="inline-flex items-center text-center text-sm font-medium bg-secondary-db-5 rounded-md mb-4">
                    <Image
                        src="/icons/support.svg"
                        alt="Support"
                        width={30}
                        height={30}
                        className="inline block p-1"
                    />
                    <span className="pl-1 pr-2 inline text-secondary-db-100">
                        Support
                    </span>
                </span>

                {/* Heading */}
                <h1 className="text-5xl mt-4 font-semibold text-secondary-db-100">
                    We're Here to Help
                </h1>

                {/* Contact Section */}
                <div className="blue-bg-dots px-8 py-8 my-12 rounded-2xl md:min-w-6xl mx-auto flex flex-col md:flex-row text-white relative">
                    {/* Left Section */}
                    <div className="flex-1 mt-6">
                        <h1 className="text-4xl text-left font-semibold mb-3">
                            Contact Us
                        </h1>
                        <p className="text-white font-normal text-left text-base leading-relaxed mb-8 max-w-sm">
                            Whether you have questions, need support, or just want to say hello,
                            we’re here to help!
                        </p>
                        <div className="text-left mt-90">
                            <p className="text-left font-normal text-base">
                                Support Mail
                            </p>
                            <a
                                href="mailto:info@wayosrted.com"
                                className="text-white font-normal underline text-base"
                            >
                                Info@wayosrted.com
                            </a>
                        </div>
                    </div>

                    {/* Right Section - Contact Form */}
                    <ContactForm />
                </div>
            </section>

            {/* FAQs Section */}
            <section className="w-full bg-white flex flex-col items-center justify-center text-center pt-11">
                {/* Badge */}
                <span className="inline-flex items-center text-center text-sm font-medium bg-secondary-db-5 rounded-md">
                    <Image
                        src="/icons/faqs.svg"
                        alt="FAQs"
                        width={30}
                        height={30}
                        className="inline block p-1"
                    />
                    <span className="pl-1 pr-2 py-1 inline text-secondary-db-100">
                        FAQs
                    </span>
                </span>

                {/* Heading */}
                <h1 className="mt-4 mb-3 text-4xl font-semibold text-secondary-db-100">
                    <span className="bg-tertiary-voilet-500/10 rounded-xl text-tertiary-voilet-500 px-4">
                        Top
                    </span>{" "}
                    Frequently Asked Questions
                </h1>
                <p className="text-secondary-db-70 max-w-4xl mx-auto text-lg">
                    Get quick answers to the most frequently asked questions about our products, services and policies.
                </p>
                <FAQ />
                <JoinCommunity />
            </section>
            <Footer />
        </main>
        </>
    );
}
