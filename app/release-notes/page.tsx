"use client";

import ReleaseNotes from "@/components/ReleaseNotes";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useBanner } from "@/context/BannerContext";

export default function ReleaseNotesPage() {
    const { showBanner, setShowBanner } = useBanner();

    return (
        <main className={`min-h-screen bg-white transition-all duration-300 select-none ${showBanner ? "pt-24" : "pt-16"}`}>
            <Header showBanner={showBanner} setShowBanner={setShowBanner} />
            <ReleaseNotes />
            <Footer />
        </main>
    );
}
