"use client";

import { BannerProvider } from "@/context/BannerContext";
import { UserProvider } from "@/context/UserContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    // Splash loader wrapper intentionally disabled.
    return (
        <BannerProvider>
            <UserProvider>
                {children}
            </UserProvider>
        </BannerProvider>
    );
}
