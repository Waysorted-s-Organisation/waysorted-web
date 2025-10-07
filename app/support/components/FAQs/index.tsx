"use client";
import { useState } from "react";
import Image from "next/image";
import { faqData } from "@/app/support/data";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-10 md:px-5 md:py-16">
      <div className="space-y-3 md:space-y-4">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="bg-white outline outline-1 outline-secondary-db-20 rounded-lg md:rounded-xl transition-all duration-300"
          >
            <button
              onClick={() => toggleFAQ(index)}
              aria-label="Toggle FAQ"
              className={`relative flex items-center justify-between w-full py-3 px-4 md:py-4 md:px-8 focus:outline-none cursor-pointer space-x-4 md:space-x-6 ${
                openIndex !== index ? "hover:bg-tertiary-voilet-100 hover:outline-none hover:rounded-lg md:hover:rounded-xl" : ""
              }`}
            >
              {/* Question */}
              <span className="text-base md:text-xl font-regular text-secondary-db-100 text-left">
                {faq.question}
              </span>

              {/* Icon */}
              <div
                className={`absolute right-4 md:right-5 transition-colors p-2 md:p-3 ${
                  openIndex === index ? "hover:bg-tertiary-voilet-100 rounded-full" : ""
                }`}
              >
                <Image
                  src="/icons/chevron-down.svg"
                  alt="Chevron Down"
                  width={13}
                  height={6}
                  className={`transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
            {/* Answer */}
            <div
              id={`faq-panel-${index}`}
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-60 md:max-h-40 px-4 md:px-8 pb-3 md:pb-4" : "max-h-0"
              }`}
            >
              <p className="text-secondary-db-100 text-sm md:text-base font-regular text-left leading-relaxed">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}