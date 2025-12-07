'use client';

import Image from "next/image";
import { useRouter } from 'next/navigation';

export default function MobileRedirectPage() {
  const router = useRouter();

  return (
    // min-h-screen ensures it covers the whole phone screen
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center blue-bg-dots bg-secondary-db-100">
      <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
        
        {/* Icon container */}
        <div className="mb-8 rounded-2xl bg-primary-way-100 backdrop-blur-sm border border-white/20 shadow-lg">
          <Image
            src="/icons/figma-redirect.svg" // Make sure this icon exists
            alt="Figma Redirect"
            width={62}
            height={62}
            className="w-16 h-16"
          />
        </div>
        
        {/* Text */}
        <h1 className="text-2xl font-medium text-white mb-10 leading-snug">
          Open Figma on Desktop to use this feature.
        </h1>

        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center justify-center gap-2 bg-secondary-db-100 text-white px-6 py-3.5 rounded-lg font-semibold text-sm border border-white/20 active:scale-95 transition-transform"
        >
          <Image
            src="/icons/white-back-icon.svg"
            alt="Arrow Left"
            width={16}
            height={16}
            className="inline-block"
          />
          <span>Go back to home page</span>
        </button>
      </div>
    </div>
  );
}