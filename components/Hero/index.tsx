'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const designerAvatars = [
  '/icons/Designer1.jpg',
  '/icons/Designer2.jpg',
  '/icons/Designer3.jpg',
];

const recognitions = [
  {
    src: '/images/recognitions/nvidia-inception.png',
    alt: 'NVIDIA Inception Program member',
    width: 329,
    height: 89,
  },
  {
    src: '/images/recognitions/founders-inc.png',
    alt: 'Founders, Inc. member',
    width: 398,
    height: 89,
  },
  {
    src: '/images/recognitions/dpiit-startup-india.png',
    alt: 'DPIIT Startup India recognized',
    width: 314,
    height: 89,
  },
];

export default function Hero() {
  const router = useRouter();

  const handleSuggestionClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    // Desktop follows the href to /requests. Mobile keeps its existing detour.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      event.preventDefault();
      router.push('/mobile-redirect');
    }
  };

  return (
    <section id="hero" className="mx-auto max-w-7xl px-4 pb-7 pt-12 sm:px-6 lg:px-8">
      <div id="hero-content" className="flex flex-col items-center text-center">
        {/* A real <a href> so crawlers can follow it to /requests, with the
            existing mobile behaviour preserved by intercepting the click. */}
        <Link
          href="/requests"
          onClick={handleSuggestionClick}
          className="inline-flex items-center gap-2 rounded-xl bg-[#f4f4f4] p-1.5 pr-3 text-sm font-medium text-secondary-db-100 transition-colors hover:bg-[#ececec] active:scale-[0.98]"
        >
          <span className="rounded-lg bg-primary-way-100 px-3 py-2 font-semibold text-white">
            Suggest a tool
          </span>
          <span>What should we build next?</span>
          <Image src="/icons/chevron-right.svg" alt="" width={7} height={12} />
        </Link>

        <div className="mt-9 flex items-center text-sm font-medium text-secondary-db-70">
          <div className="mr-1.5 flex -space-x-2" aria-hidden="true">
            {designerAvatars.map((avatar, index) => (
              <Image
                key={avatar}
                src={avatar}
                alt=""
                width={22}
                height={22}
                className="h-[22px] w-[22px] rounded-full border-2 border-white object-cover"
                priority={index === 0}
              />
            ))}
          </div>
          <span>Trusted by 500+ Designers</span>
        </div>

        <h1 className="mt-2 max-w-5xl text-[clamp(2.75rem,5.6vw,4.5rem)] font-medium leading-[1.02] tracking-[-0.045em] text-secondary-db-100">
          <span className="block">The only toolkit you need</span>
          <span className="mt-2 block text-[#8f8f8f]">for every design task</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-sm font-medium leading-relaxed text-secondary-db-80 md:text-base">
          Built to replace them all with one unified tool suite which works across softwares.
        </p>

        <div className="mt-8 flex flex-col items-center">
          <button
            type="button"
            onClick={() => router.push('/signup')}
            className="rounded-full border border-secondary-db-80 bg-[#111820] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#242b33] active:scale-[0.98]"
          >
            Get Started for Free
          </button>
          {/* Crawlable: this is the homepage's only link to /pricing. */}
          <Link
            href="/pricing"
            className="mt-2 text-sm font-medium text-secondary-db-80 underline underline-offset-2 transition-colors hover:text-secondary-db-100"
          >
            See our Plans
          </Link>
        </div>

        <div
          className="mt-8 flex w-full max-w-[560px] items-center justify-center gap-x-4 sm:gap-x-5"
          aria-label="Waysorted programs and recognitions"
        >
          {recognitions.map((recognition) => (
            <Image
              key={recognition.src}
              src={recognition.src}
              alt={recognition.alt}
              width={recognition.width}
              height={recognition.height}
              className="h-auto w-[30%] max-w-[172px] object-contain"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
