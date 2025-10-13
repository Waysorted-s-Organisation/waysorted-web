"use client";
import Image from "next/image";
import ContactForm from "./components/ContactForm";
import JoinCommunity from "@/components/JoinCommunity";
import FAQ from "./components/FAQs";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SupportPage() {
  const { showBanner, setShowBanner } = useBanner();

  return (
    <>
      <main
        className={`min-h-screen bg-white transition-all duration-300 ${
          showBanner ? "pt-24" : "pt-16"
        } `}
      >
        <Header showBanner={showBanner} setShowBanner={setShowBanner} />

        {/* Support Section */}
        <section className="w-full bg-white flex flex-col items-center justify-center text-center py-10 md:py-16 px-4">
          <div className="w-full max-w-7xl mx-auto">
            {/* Badge */}
            <span className="inline-flex items-center text-center text-xs sm:text-sm font-medium bg-secondary-db-5 rounded-md mb-4">
              <Image
                src="/icons/support.svg"
                alt="Support"
                width={24}
                height={24}
                className="inline block p-1"
              />
              <span className="pl-1 pr-2 inline text-secondary-db-100">Support</span>
            </span>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl mt-4 font-semibold text-secondary-db-100">
              We&apos;re Here to Help
            </h1>

            {/* Contact Section */}
            <div className="blue-bg-dots w-full max-w-6xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 my-8 md:my-12 rounded-2xl mx-auto flex flex-col md:flex-row items-stretch text-white relative gap-6 md:gap-8">
              {/* Left Section */}
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl md:text-4xl text-left font-semibold mb-3">
                  Contact Us
                </h2>
                <p className="text-white font-normal text-left text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-none md:max-w-sm">
                  Whether you have questions, need support, or just want to say hello,
                  we&apos;re here to help!
                </p>
                <div className="text-left mt-6 md:mt-90">
                  <p className="text-left font-normal text-sm sm:text-base">Support Mail</p>
                  <a
                    href="mailto:info@wayosrted.com"
                    className="text-white font-normal underline text-sm sm:text-base break-words"
                  >
                    Info@wayosrted.com
                  </a>
                </div>
              </div>

              {/* Right Section - Contact Form */}
              <div className="flex-1 w-full md:w-[52%] mt-2 md:mt-0">
                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="w-full bg-white flex flex-col items-center justify-center text-center pt-8 md:pt-11">
          <div className="w-full max-w-7xl mx-auto">
            {/* Badge */}
            <span className="inline-flex items-center text-center text-xs sm:text-sm font-medium bg-secondary-db-5 rounded-md">
              <Image
                src="/icons/faqs.svg"
                alt="FAQs"
                width={24}
                height={24}
                className="inline block p-1"
              />
              <span className="pl-1 pr-2 py-1 inline text-secondary-db-100">FAQs</span>
            </span>

            {/* Heading */}
            <h2 className="mt-4 mb-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-secondary-db-100 pb-4">
              <span className="bg-tertiary-voilet-500/10 rounded-xl text-tertiary-voilet-500 px-3 sm:px-4">
                Top
              </span>{" "}
              Frequently Asked Questions
            </h2>
            <p className="text-secondary-db-80 max-w-4xl mx-auto text-base md:text-lg px-1 sm:px-0">
              Get quick answers to the most frequently asked questions about our products,
              services and policies.
            </p>

            <div className="">
              <FAQ />
            </div>

            <div className="mt-10 sm:mt-12">
              <JoinCommunity />
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}