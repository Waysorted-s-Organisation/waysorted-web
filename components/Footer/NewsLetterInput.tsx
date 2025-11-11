import React, { useState } from "react";

type Props = {
  placeholder?: string;
  onSubmit?: (email: string) => void;
  wrapperClassName?: string;
};

export default function NewsletterInput({
  placeholder = "Your email",
  onSubmit,
  wrapperClassName = "flex items-center bg-white rounded-xl overflow-hidden w-full max-w-md",
}: Props) {
  const [email, setEmail] = useState("");

  const emailIsValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isValid = emailIsValid(email);

  function handleSubmit() {
    if (!isValid) return;
    onSubmit?.(email.trim());
  }

  return (
    <div className={wrapperClassName}>
      <input
        type="email"
        aria-label="Email address"
        placeholder={placeholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
        }}
        // restored the original compact size you had
        className="w-full px-3 sm:px-4 py-2 text-secondary-db-60 placeholder:text-secondary-db-40 focus:outline-none"
      />

      {/* Button kept small and vertically centered; overlaps input using negative margin */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid}
        aria-disabled={!isValid}
        title="Send"
        className={[
          "flex items-center justify-center -ml-8 sm:-ml-10 rounded-lg cursor-pointer w-8 h-8 sm:w-9 sm:h-9 transition-colors duration-200",
          // background and icon color depend on validity (uses currentColor for svg stroke)
          isValid ? "bg-primary-way-20 text-primary-way-80" : "bg-secondary-db-5 text-secondary-db-60",
          !isValid ? "opacity-95" : "",
        ].join(" ")}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 14 14"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          focusable="false"
          className="block"
        >
          <path
            d="M1 13L13 1M13 1H2.5M13 1V11.5"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeWidth={1.2}
          />
        </svg>
      </button>
    </div>
  );
}