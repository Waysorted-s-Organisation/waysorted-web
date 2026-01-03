import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Request a Feature to Waysorted",
    description:
        "Have an idea or suggestion? Suggest a feature or improvement, your feedback drives our roadmap. Help shape the future of Waysorted.",
    alternates: {
        canonical: "https://www.waysorted.com/request-a-feature",
    },
    openGraph: {
        title: "Request a Feature | Waysorted",
        description:
            "Have an idea or suggestion? Suggest a feature or improvement, your feedback drives our roadmap.",
        url: "https://www.waysorted.com/request-a-feature",
        type: "website",
    },
};

export default function RequestFeaturePage() {
    // Temporarily redirect to not-found while the feature module is being fixed
    redirect("/not-found");
}
