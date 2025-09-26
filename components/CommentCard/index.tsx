import React from "react";
import Image from "next/image";

type Props = {
  username?: string;
  role?: string;
  avatarSrc?: string;
  comment?: string;
  brandLogo?: string;
  className?: string;
};

export default function CommentCard({
  username = "Username",
  role = "Figma User",
  avatarSrc,
  comment =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean eleifend condimentum risus, id vestibulum mi feugiat vel",
  brandLogo,
}: Props) {
  return (
    <div className="w-full max-w-sm mx-auto">
      {/* soft rotated background to mimic the original depth */}
      <div className="relative">
        <div className="absolute -inset-1 transform rotate-1 rounded-2xl bg-slate-800/5 -z-10" />

        <div className="relative bg-white rounded-2xl shadow-[0_10px_30px_rgba(2,6,23,0.3)] border border-slate-200 p-4 flex gap-4 items-start rotate-[-1deg]">
          {/* avatar */}
          <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="#E6EEF6" />
                <path d="M12 12.5a3 3 0 100-6 3 3 0 000 6z" fill="#CBDFF1" />
                <path d="M4.5 19a7.5 7.5 0 0115 0" stroke="#CBDFF1" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          {/* text */}
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-900">{username}</div>
                <div className="text-xs text-slate-500">{role}</div>
              </div>

              {/* small brand logo at top-right */}
              {brandLogo && (
                <div className="ml-2 shrink-0" aria-hidden>
                  <Image
                    src={brandLogo} // e.g., "/icons/figma.svg"
                    alt="Figma"
                    width={24}  
                    height={24}
                    className="w-6 h-6"
                  />
                </div>
              )}
            </div>

            <p className="mt-3 text-sm text-slate-700 leading-relaxed">{comment}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/*
Usage example:

import CommentCard from "./CommentCard";

<CommentCard
  username="Sushant Kumar"
  role="Figma User"
  avatarSrc="/path/to/avatar.jpg" // optional
  comment="This is a short comment describing the user's feedback."
/>

Notes:
- This component uses Tailwind CSS classes. Adjust spacing, rotations and colors to match your project theme.
- To precisely match the original card (shadows and exact rotation), tweak the shadow and rotate utilities.
*/