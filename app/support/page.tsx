"use client"
import Image from "next/image";
import { useState } from "react";

export default function SupportPage() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Form submitted:", formData);
        alert("Thank you for contacting us!");
        setFormData({
            firstName: "",
            lastName: "",
            email: "",
            subject: "",
            message: "",
        });
    };

    return (
        <>
                <section className="w-full flex flex-col items-center justify-center text-center my-16">
                    {/* Badge */}
                    <span className="inline-flex items-center text-center text-sm font-medium bg-secondary-db-5 rounded-md mb-4">
                        <Image
                            src="/icons/avail.svg"
                            alt="Support"
                            width={30}
                            height={30}
                            className="inline block p-1"
                        />
                        <span className="pl-1 pr-2 inline text-secondary-db-100">Support</span>
                    </span>
                    <h1 className="text-5xl mt-4 font-semibold text-secondary-db-100">
                        We're Here to Help
                    </h1>
                    <div className="blue-bg-dots px-7 py-13 my-12 rounded-2xl md:min-w-6xl mx-auto flex flex-col md:flex-row text-white relative">
                        {/* Left Section */}
                        <div className="flex-1">
                            <h1 className="text-4xl text-left font-semibold mb-3">Contact Us</h1>
                            <p className="text-white font-normal text-left text-base leading-relaxed mb-8 max-w-sm">
                                Whether you have questions, need support, or just want to say hello,
                                we’re here to help!
                            </p>
                            <div className="text-left mt-90">
                                <p className=" text-left font-normal text-base">Support Mail</p>
                                <a
                                    href="mailto:info@wayosrted.com"
                                    className="text-white font-normal underline text-base"
                                >
                                    Info@wayosrted.com
                                </a>
                            </div>
                        </div>

                        {/* Right Section - Contact Form */}
                        <div className="flex-1 bg-white/25 rounded-xl shadow-lg p-6 md:p-8 text-gray-800">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-left block text-sm font-regular text-white">
                                            First Name<span className="text-gold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            aria-label="First Name"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 w-full px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-4 focus:ring-white/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-left block text-sm font-regular text-white">
                                            Last Name<span className="text-gold">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            aria-label="Last Name"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                            required
                                            className="mt-1 w-full px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-4 focus:ring-white/30"
                                        />
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="text-left block text-sm font-regular text-white">
                                        Email<span className="text-gold">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        aria-label="Email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 w-full px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-4 focus:ring-white/30"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-left block text-sm font-regular text-white">
                                        Subject<span className="text-gold">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        aria-label="Subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="mt-1 w-full px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-4 focus:ring-white/30"
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="text-left block text-sm font-regular text-white">
                                        Message<span className="text-gold">*</span>
                                    </label>
                                    <textarea
                                        name="message"
                                        aria-label="Message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={4}
                                        className="mt-1 w-full px-3 py-2 bg-white rounded-md focus:outline-none focus:ring-4 focus:ring-white/30"
                                    />
                                </div>

                                {/* Terms */}
                                <div className="flex items-center text-left block text-sm font-regular text-white">
                                    <span className="mr-2 w-4 h-4 rounded-sm bg-white text-primary-way-100 text-xs font-extrabold text-center">i
                                    </span>
                                    By submitting this email you agree to our{" "}
                                    <a
                                        href="/terms"
                                        className="ml-1 text-white underline hover:text-primary-way-100"
                                    >
                                        Terms
                                    </a>
                                </div>

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    className="w-full bg-secondary-db-100 hover:bg-secondary-db-90 text-white py-3 rounded-md transition flex items-center justify-center gap-2 cursor-pointer font-medium"
                                >
                                    Submit
                                    <Image
                                        src="/icons/arrow-white.svg"
                                        alt="Arrow Right"
                                        width={10}
                                        height={10}
                                        className="inline"
                                    />
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
                <section className="w-full flex flex-col items-center justify-center text-center mt-11">
                    {/* Badge */}
                    <span className="inline-flex items-center text-center text-sm font-medium bg-secondary-db-5 rounded-md">
                        <Image
                            src="/icons/avail.svg"
                            alt="FAQs"
                            width={30}
                            height={30}
                            className="inline block p-1"
                        />
                        <span className="pl-1 pr-2 py-1 inline text-secondary-db-100">FAQs</span>
                    </span>
                    <h1 className="mt-4 text-4xl font-semibold text-secondary-db-100">
                        <span className="bg-tertiary-voilet-500/10 rounded-xl text-tertiary-voilet-500 px-4">
          Top
        </span> Frequently Asked Questions
                    </h1>
                </section>
        </>
    );
}
