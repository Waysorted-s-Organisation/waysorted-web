import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Waysorted - Accelerate every idea with one powerful suite',
  description: 'Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.',
  keywords: ['design tools', 'figma plugin', 'productivity', 'waysorted', 'design workflow', 'color palette', 'unit converter', 'file importer', 'frames to pdf'],
  authors: [{ name: 'Waysorted', url: 'https://www.waysorted.com' }],
  creator: 'Waysorted Infotech Pvt Ltd',
  publisher: 'Waysorted',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://www.waysorted.com/bio',
  },
  openGraph: {
    title: 'Waysorted - Accelerate every idea with one powerful suite',
    description: 'Discover one unified tool suite which works across softwares. Explore a collection of tools built to accelerate workflow and get work done faster.',
    url: 'https://www.waysorted.com/bio',
    siteName: 'Waysorted',
    locale: 'en_IN',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Waysorted - Accelerate every idea with one powerful suite',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Waysorted - Accelerate every idea with one powerful suite',
    description: 'Discover one unified tool suite which works across softwares.',
    images: ['/images/og-image.png'],
    creator: '@Waysorted',
    site: '@Waysorted',
  },
  other: {
    'geo.region': 'IN',
    'geo.placename': 'India',
    'geo.position': '20.5937;78.9629',
    'ICBM': '20.5937, 78.9629',
  },
};


export default function Bio() {

  const links = [
    {
      icon: '/icons/figma-logo-black.svg',
      text: 'Design Smarter in Figma (Join the Beta)',
      link: 'https://www.figma.com/community/plugin/1532842109377504268/waysorted',
    },
    {
      icon: '/icons/figma-logo-black.svg',
      text: 'Free Access to all Premium tools for first 200*',
      link: 'https://www.figma.com/community/plugin/1532842109377504268/waysorted',
    },
    {
      icon: '/images/way-mark-black.png',
      text: 'Waysorted.com (Getting Started)',
      link: 'https://waysorted.com',
    },

    {
      icon: '/images/way-mark-black.png',
      text: 'Request Feature (Vote. Discuss. Influence.)',
      link: 'https://waysorted.com/requests',
    },
  ];

  const socials = [
    { label: 'Instagram', href: 'https://www.instagram.com/waysorted/', icon: '/icons/insta-logo-black.svg' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/waysortedhq', icon: '/icons/linkedin-logo-black.svg' },
    { label: 'Discord', href: 'https://discord.gg/U2XF76WxNv', icon: '/icons/discord-logo-black.svg' },
    { label: 'X', href: 'https://x.com/Waysorted', icon: '/icons/x-logo-black.svg' },
  ];

  return (
    <div className="bio-bg-dots min-h-screen flex flex-col items-center justify-center px-4 sm:px-0">
      <div className="flex flex-col items-center mb-6">
        {/* The brand lockup the rest of the product settled on - Header and
            WaysortedLogo both use this mark. The old waysorted-logo-black.svg was a
            grey gradient whose 53.5 rect sat in a 54 viewBox, leaving a transparent
            sliver on two edges that the rounded corners made visible. */}
        <div className="mb-2 h-12 w-12 overflow-hidden rounded-lg bg-[#181818] sm:h-[54px] sm:w-[54px]">
          <Image
            src="/images/way-mark-black.png"
            alt="Waysorted"
            width={54}
            height={54}
            className="h-full w-full object-cover"
            priority
          />
        </div>
        <p className="text-black text-lg sm:text-xl font-semibold text-center">
          Say Hii to Way!
        </p>
      </div>
      <ul className="space-y-3 sm:space-y-4 w-full max-w-md sm:max-w-7xl px-2 sm:px-4">
        {links.map((link, index) => (
          <li key={index}>
            <Link
              href={link.link}
              target="_blank"
              rel="noopener noreferrer"
              className="relative flex items-center justify-center bg-white rounded py-3 sm:py-4 px-4 sm:px-6 hover:opacity-90 transition"
            >
              {/* A fixed box, because the two marks are different shapes: the Figma
                  logo is 22x31 and the way mark is square, so sizing the <img> alone
                  left the rows visibly uneven. alt is empty - the row text is the label. */}
              <span className="absolute left-4 flex h-6 w-6 items-center justify-center sm:left-70">
                <Image
                  src={link.icon}
                  alt=""
                  width={24}
                  height={24}
                  className="max-h-full max-w-full object-contain"
                />
              </span>
              <span className="text-black text-base sm:text-xl font-semibold text-center px-6 sm:px-0">
                {link.text}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {/* Fixed 40x40 tiles that centre their icon, so the four marks — which have
          four different intrinsic ratios (15x15, 15x15, 18x14, 15x14) and are served
          unoptimised as SVG — sit on a common baseline instead of setting their own. */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {socials.map((social) => (
          <a
            key={social.label}
            href={social.href}
            className="flex h-10 w-10 items-center justify-center rounded-md bg-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={social.icon}
              alt={social.label}
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </a>
        ))}
      </div>
    </div>
  );
}
