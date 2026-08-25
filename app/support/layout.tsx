import { Metadata } from 'next';

export const metadata: Metadata = {
    title: "Contact Waysorted Support",
    description: "Get in touch with the Waysorted team for support, questions, or feedback. We're here to help you get the most out of your design workflow.",
    openGraph: {
        title: "Contact Waysorted Support",
        description: "Get in touch with the Waysorted team for support, questions, or feedback.",
        url: "https://www.waysorted.com/support",
        images: [
            {
                url: "/images/og-image.e13cfee0.png",
                width: 1200,
                height: 675,
                alt: "Waysorted - Accelerate every idea with one powerful suite",
            },
        ],
    },
    alternates: {
        canonical: "https://www.waysorted.com/support",
    }
};

export default function SupportLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
