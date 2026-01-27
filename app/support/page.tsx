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

  // JSON-LD for FAQPage
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Waysorted?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Waysorted unifies essential design tools into one place, so you spend less time switching between plugins and tabs. By reducing tool juggling, it helps teams work faster, stay focused, and avoid unnecessary costs from managing multiple tools."
        }
      },
      {
        "@type": "Question",
        "name": "How is Waysorted different from the other apps or plugins sources?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Unlike individual plugins or scattered tool sources, Waysorted brings essential tools together in one unified suite. This reduces compatibility issues, performance strain, scattered support, and the cost of managing multiple subscriptions."
        }
      },
      {
        "@type": "Question",
        "name": "What kind of tools are included?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Waysorted currently includes four core tools for color management, PDF export, file importing, and unit conversion. More tools are planned, including Way AI and additional utilities designed to further simplify and streamline creative workflows."
        }
      },
      {
        "@type": "Question",
        "name": "Who creates these tools packs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "The core packs are created by a team of highly skilled designers & developers."
        }
      },
      {
        "@type": "Question",
        "name": "Can I suggest tools to be included?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, through the Request-a-Feature tab which encourages user input and suggestions."
        }
      },
      {
        "@type": "Question",
        "name": "Will Waysorted slow down my Figma?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No, Our unified design minimizes system strain and performance issues rather improves accessibility that lacks with multiple disjointed plugins."
        }
      },
      {
        "@type": "Question",
        "name": "Is Waysorted safe and secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we emphasize secure tool bundling and usability within Figma's ecosystem while complying all certificates as an integrated platform."
        }
      },
      {
        "@type": "Question",
        "name": "What if I face issues while using Waysorted?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Reach out to support, the platform provides consistent, up-to-date assistance to resolve any concerns. Moreover, use the Report-a-Bug tab for reporting issues."
        }
      },
      {
        "@type": "Question",
        "name": "How do I get started?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Open the Waysorted Figma plugin to start using the tools available during the beta. All current features are accessible for testing and feedback."
        }
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main
        className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"
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
                width={30}
                height={30}
                className="inline-block p-1"
              />
              <span className="pl-1 pr-2 inline text-secondary-db-100">Support</span>
            </span>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl mt-4 font-semibold text-secondary-db-100">
              Get in Touch with Waysorted
            </h1>

            {/* Contact Section */}
            <div className="blue-bg-dots w-full max-w-7xl px-4 sm:px-6 md:px-8 py-6 sm:py-8 my-8 md:my-12 rounded-2xl mx-auto flex flex-col md:flex-row items-stretch text-white relative gap-6 md:gap-8">
              {/* Left Section */}
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl md:text-4xl text-left font-semibold mb-3">
                  Contact Us
                </h2>
                <p className="text-white font-normal text-left text-sm sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-none md:max-w-sm">
                  Whether you have questions, need support, or just want to say hello,
                  we&apos;re here to help!
                </p>
                <div className="text-left mt-6 md:mt-24">
                  <p className="text-left font-normal text-sm sm:text-base">Support Mail</p>
                  <a
                    href="mailto:info@waysorted.com"
                    className="text-white font-normal underline text-sm sm:text-base break-words"
                  >
                    Info@waysorted.com
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
                width={30}
                height={30}
                className="inline-block p-1"
              />
              <span className="pl-1 pr-2 py-1 inline text-secondary-db-100">FAQs</span>
            </span>

            {/* Heading */}
            <h2 className="mt-4 mb-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-secondary-db-100 pb-4">
              <span className="bg-tertiary-voilet-500/10 rounded-lg text-tertiary-voilet-500 px-3 sm:px-4 py-1">
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
