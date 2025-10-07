"use client";
import GlowStarButton from "@/components/GlowStarButton/index";
import { useState } from "react";
import Image from "next/image";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Optional: send to API here

    // Flip to thank-you side
    setSubmitted(true);

    // Reset fields (optional)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    // Keep flex-1 so it respects surrounding layout
    <div className="flex-1 relative w-full [perspective:1000px]">
      <div
        className={`relative w-full min-h-[570px] md:min-h-[560px] h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          submitted ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front side - Form */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="bg-white/25 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 text-gray-800 h-full">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-left block text-xs sm:text-sm font-regular text-white">
                    First Name<span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    aria-label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full px-3 py-2 bg-white rounded-md text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30"
                  />
                </div>
                <div>
                  <label className="text-left block text-xs sm:text-sm font-regular text-white">
                    Last Name<span className="text-gold">*</span>
                  </label>
                  <input
                    type="text"
                    aria-label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="mt-1 w-full px-3 py-2 bg-white rounded-md text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-left block text-xs sm:text-sm font-regular text-white">
                  Email<span className="text-gold">*</span>
                </label>
                <input
                  type="email"
                  aria-label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full px-3 py-2 bg-white rounded-md text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-left block text-xs sm:text-sm font-regular text-white">
                  Subject<span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  aria-label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="mt-1 w-full px-3 py-2 bg-white rounded-md text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-left block text-xs sm:text-sm font-regular text-white">
                  Message<span className="text-gold">*</span>
                </label>
                <textarea
                  name="message"
                  aria-label="Message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="mt-1 w-full px-3 py-2 bg-white rounded-md text-sm sm:text-base focus:outline-none focus:ring-4 focus:ring-white/30"
                />
              </div>

              {/* Terms */}
              <div className="flex flex-col md:flex-row md:items-center items-start gap-1 text-left text-xs sm:text-sm font-regular text-white">
                <span className="mr-0 md:mr-2 w-4 h-4 rounded-sm bg-white text-primary-way-100 text-[10px] font-extrabold leading-4 text-center">
                  i
                </span>
                <span>
                  By submitting this email you agree to our{" "}
                  <a
                    href="/terms"
                    className="ml-0 md:ml-1 text-white underline hover:text-primary-way-100"
                  >
                    Terms
                  </a>
                </span>
              </div>

              {/* Submit Button */}
              <GlowStarButton
                className="w-full shadow-glow hover:bg-secondary-db-90 py-3 rounded-md transition flex items-center justify-center gap-2 cursor-pointer font-medium"
                title="Submit"
                type="submit"
                aria-label="Submit"
                rerollOnHover
                randomizeOnMount
              >
                <span className="flex items-center justify-center gap-x-2 w-full">
                  Submit
                  <Image
                    src="/icons/arrow-white.svg"
                    alt="Arrow Right"
                    width={16}
                    height={16}
                    className="ml-1 inline-block"
                  />
                </span>
              </GlowStarButton>
            </form>
          </div>
        </div>

        {/* Back side - Thank You */}
        <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
          <div className="bg-white/25 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 h-full flex flex-col items-center justify-center text-center">
            <Image
              src="/icons/success.svg"
              alt="Thank You Star"
              width={56}
              height={56}
              className="mb-4"
            />
            <h2 className="text-lg sm:text-xl font-medium text-white mb-2">
              Thank you for reaching out to Waysorted!
            </h2>
            <p className="text-white text-xs sm:text-sm font-medium max-w-md">
              We’ve received your message and our team will get back to you shortly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}