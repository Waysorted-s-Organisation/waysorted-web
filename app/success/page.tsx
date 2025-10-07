"use client";
import { useBanner } from "@/context/BannerContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
export default function SuccessPage() {
    const { showBanner, setShowBanner } = useBanner();
  return (
    <div>
      <main
            className={`min-h-screen bg-white transition-all duration-300 ${showBanner ? "pt-24" : "pt-16"
                }`}
        >
            <Header showBanner={showBanner} setShowBanner={setShowBanner} />
      <h1>Success!</h1>
      <p>Your action was successful.</p>
      <Footer />
    </main>
    </div>
  );
}
