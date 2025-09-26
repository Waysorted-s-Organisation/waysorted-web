"use client";
import { useState } from "react";
import Image from "next/image";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Quisque molestie ex id velit vestibulum mattis. Pellentesque id metus dapib?",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis dui, accumsan eu facilisis vel, accumsan ac lorem. Proin rutrum magna id purus tincidunt, et sagittis sem interdum. Proin ac sem sapien. Orci varius natoque penatibus et magnis.",
  },
  {
    question: "Quisque molestie ex id velit vestibulum mattis. Pellentesque id metus dapib?",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis dui, accumsan eu facilisis vel, accumsan ac lorem. Proin rutrum magna id purus tincidunt, et sagittis sem interdum. Proin ac sem sapien. Orci varius natoque penatibus et magnis.",
  },
  {
    question: "Quisque molestie ex id velit vestibulum mattis. Pellentesque id metus dapib?",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis dui, accumsan eu facilisis vel, accumsan ac lorem. Proin rutrum magna id purus tincidunt, et sagittis sem interdum. Proin ac sem sapien. Orci varius natoque penatibus et magnis.",
  },
  {
    question: "Quisque molestie ex id velit vestibulum mattis. Pellentesque id metus dapib?",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis dui, accumsan eu facilisis vel, accumsan ac lorem. Proin rutrum magna id purus tincidunt, et sagittis sem interdum. Proin ac sem sapien. Orci varius natoque penatibus et magnis.",
  },
  {
    question: "Quisque molestie ex id velit vestibulum mattis. Pellentesque id metus dapib?",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis dui, accumsan eu facilisis vel, accumsan ac lorem. Proin rutrum magna id purus tincidunt, et sagittis sem interdum. Proin ac sem sapien. Orci varius natoque penatibus et magnis.",
  },
  {
    question: "Quisque molestie ex id velit vestibulum mattis. Pellentesque id metus dapib?",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque felis dui, accumsan eu facilisis vel, accumsan ac lorem. Proin rutrum magna id purus tincidunt, et sagittis sem interdum. Proin ac sem sapien. Orci varius natoque penatibus et magnis.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-16">
      <div className="space-y-4">
        {faqData.map((faq, index) => (
          <div
            key={index}
            className="bg-white outline outline-1 outline-secondary-db-20 rounded-xl transition-all duration-300"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className={`relative flex items-center justify-center w-full py-4 text-center focus:outline-none cursor-pointer space-x-6 ${
                openIndex !== index ? "hover:bg-tertiary-voilet-100 hover:outline-none hover:rounded-xl" : ""
              }`}
            >
              {/* Question */}
              <span className="text-xl font-regular text-secondary-db-100">{faq.question}</span>

              {/* Icon */}
              <div
                className={`absolute right-5 transition-colors p-3 ${
                  openIndex === index ? "bg-tertiary-voilet-100 rounded-full" : ""
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
              className={`overflow-hidden transition-all duration-300 ${
                openIndex === index ? "max-h-40 px-5 pb-4" : "max-h-0"
              }`}
            >
              <p className="text-secondary-db-100 text-base font-regular">{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
