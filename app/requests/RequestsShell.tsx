"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { PropsWithChildren } from "react";

export default function RequestsShell({ children }: PropsWithChildren) {
    const router = useRouter();

    return (
        <>
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col items-center justify-center p-6 text-center blue-bg-dots bg-secondary-db-100">
                <div className="relative z-10 flex flex-col items-center max-w-md mx-auto">
                    <div className="mb-8 rounded-2xl bg-primary-way-100 backdrop-blur-sm border border-white/20 shadow-lg">
                        <Image
                            src="/icons/desktop.svg"
                            alt="Desktop Experience"
                            width={62}
                            height={62}
                            className="w-16 h-16"
                        />
                    </div>

                    <h1 className="text-2xl font-medium text-white mb-10 leading-snug">
                        Way&apos;s UI delivers its best experience on desktop.
                    </h1>

                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center justify-center gap-2 bg-secondary-db-100 text-white px-6 py-3.5 rounded-lg font-semibold text-sm border border-white/20"
                    >
                        <Image
                            src="/icons/white-back-icon.svg"
                            alt="Arrow Right"
                            width={16}
                            height={16}
                            className="inline-block"
                        />
                        <span>Go back to home page</span>
                    </button>
                </div>
            </div>

            <div className="hidden lg:block h-screen">
                {children}
            </div>
        </>
    );
}
