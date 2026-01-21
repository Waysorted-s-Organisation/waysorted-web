"use client";

import { BannerProvider } from "@/context/BannerContext";
import { UserProvider } from "@/context/UserContext";
import SplashGate from "@/components/SplashGate";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <SplashGate minMs={4000} initialOnly>
            <BannerProvider>
                <UserProvider>
                    {children}
                </UserProvider>
            </BannerProvider>
        </SplashGate>
    );
}
