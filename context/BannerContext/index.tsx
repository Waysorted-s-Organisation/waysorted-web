"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface BannerContextType {
  showBanner: boolean;
  setShowBanner: (value: boolean) => void;
}

const BannerContext = createContext<BannerContextType | undefined>(undefined);

export function BannerProvider({ children }: { children: ReactNode }) {
  const [showBanner, setShowBanner] = useState(true);

  return (
    <BannerContext.Provider value={{ showBanner, setShowBanner }}>
      {children}
    </BannerContext.Provider>
  );
}

export function useBanner() {
  const context = useContext(BannerContext);
  if (!context) {
    throw new Error("useBanner must be used within a BannerProvider");
  }
  return context;
}
