"use client";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setSuccess(result.message);
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
      });

    } catch (err) {
      setError((err as Error).message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 relative w-full [perspective:1000px]">
      <div
        className={`relative w-full min-h-[570px] md:min-h-[560px] h-full transition-transform duration-700 [transform-style:preserve-3d] ${
          submitted ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front side - Form */}
        <div className="absolute inset-0 [backface-visibility:hidden]">
          <div className="bg-white/25 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 text-gray-800 h-full">
            {error && (
              <div className="mb-4 p-3 bg-red-100/90 border border-red-300 text-red-700 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {success && !submitted && (
              <div className="mb-4 p-3 bg-green-100/90 border border-green-300 text-green-700 rounded-md text-sm">
                {success}
              </div>
            )}

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
                <span className="mr-0 md:mr-[1px] w-4 h-4 rounded-sm bg-white text-primary-way-100 text-[10px] font-extrabold leading-4 text-center">
                  i
                </span>
                <span>
                  By submitting this email you agree to our{" "}
                  <a
                    href="docs/terms-of-service"
                    className="ml-0 md:ml-1 text-white underline hover:text-primary-way-100"
                  >
                    Terms
                  </a>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-secondary-db-100 rounded-lg join-shadow-1 text-white py-3 transition flex items-center justify-center gap-2 cursor-pointer font-medium ${
                  isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? "Sending..." : "Submit"}
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Image
                    src="/icons/arrow-white.svg"
                    alt="Arrow Right"
                    width={10}
                    height={10}
                    className="inline"
                  />
                )}
              </button>
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
            <p className="text-white text-xs sm:text-sm font-medium max-w-md mb-6">
              We&apos;ve received your message and our team will get back to you shortly.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setSuccess(null);
                setError(null);
              }}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-md transition-colors duration-200 text-sm font-medium"
            >
              Send Another Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}