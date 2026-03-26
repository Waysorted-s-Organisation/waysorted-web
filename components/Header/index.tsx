'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Badge from '../Badge';
import { ProductsMenu } from '../ProductsMenu';
import ResourcesMenu from '../ResourcesMenu';
import LanguageDropdown from '../LanguageDropdown';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import UserMenu from '@/components/UserMenu';
import products from "@/data/products.json"
import GlowStarButton from '@/components/GlowStarButton';

interface HeaderProps {
  showBanner: boolean;
  setShowBanner: (value: boolean) => void;
}

const Header = ({ showBanner, setShowBanner }: HeaderProps) => {
  const { user, loading, refetch } = useUser();
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  // Mobile state
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);

  const languageBtnRef = useRef<HTMLButtonElement | null>(null);
  const mobileLanguageBtnRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  // header ref so we can measure its height to detect "touch"
  const headerRef = useRef<HTMLElement | null>(null);

  // New: header mode when secure sections touch the header
  const [isSecureSection, setIsSecureSection] = useState(false);

  // Banner CTA variations - picked randomly on mount to avoid hydration mismatch
  const ctaVariations = [
    {
      text: "Create presentation-ready PDFs in one click...",
      link: "/learning/frames-to-pdf",
      linkText: "Try Frames to PDF"
    },
    {
      text: "Convert units & prep designs for print instantly...",
      link: "/learning/unit-converter",
      linkText: "Use Unit Converter"
    },
    {
      text: "Import external design assets more seamlessly...",
      link: "/learning/file-importer",
      linkText: "Start Importing"
    },
    {
      text: "Try Palettable for quick Color schemes and Contrast check...",
      link: "/learning/palettable",
      linkText: "Check Contrast"
    },
  ];
  const [ctaIndex, setCtaIndex] = useState<number | null>(null);
  useEffect(() => {
    setCtaIndex(Math.floor(Math.random() * ctaVariations.length));
  }, [ctaVariations.length]);

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      await refetch();
      router.refresh();
    } catch (e) {
      console.error('Logout failed', e);
    }
  }

  // Close menus on route change (back/forward)
  useEffect(() => {
    const closeAll = () => {
      setProductsOpen(false);
      setResourcesOpen(false);
      setLanguageOpen(false);
      setMobileOpen(false);
      setMobileProductsOpen(false);
      setMobileResourcesOpen(false);
    };
    window.addEventListener('popstate', closeAll);
    return () => window.removeEventListener('popstate', closeAll);
  }, []);

  // Close mobile drawer and dropdowns on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setLanguageOpen(false);
        setMobileProductsOpen(false);
        setMobileResourcesOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Check whether secure sections "touch" the header (top of the section reaches header bottom).
  // This uses headerRef to calculate header height, and bounding rect checks on scroll/resize.
  useEffect(() => {
    const ids = ['secure-animation', 'secure-cards', 'site-footer', 'story'];

    const updateSecureState = () => {
      const headerEl = headerRef.current;
      const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 0;

      const elms = ids
        .map((id) => document.getElementById(id))
        .filter(Boolean) as HTMLElement[];

      if (elms.length === 0) {
        setIsSecureSection(false);
        return;
      }

      // "touch" logic: element's top <= headerHeight (i.e. the top of the section has reached the header bottom)
      // and also the element is not completely scrolled past (rect.bottom > 0)
      const anyTouching = elms.some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top <= headerHeight && rect.bottom > 0;
      });

      setIsSecureSection(anyTouching);
    };

    // initial check
    updateSecureState();

    const onScroll = () => updateSecureState();
    const onResize = () => updateSecureState();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Also set up an IntersectionObserver fallback for slightly better responsiveness
    let observer: IntersectionObserver | null = null;
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (elements.length > 0 && 'IntersectionObserver' in window) {
      // We observe with threshold 0 so we get notified as soon as any intersection happens,
      // but we still rely on the "touch" bounding logic for exact header-touch behavior.
      observer = new IntersectionObserver(
        () => {
          updateSecureState();
        },
        { threshold: 0 }
      );
      elements.forEach((el) => observer?.observe(el));
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (observer) observer.disconnect();
    };
  }, []);

  // helper to choose text color based on secure section state
  const textColor = isSecureSection ? 'text-white' : 'text-secondary-db-100';
  const logoSrc = isSecureSection ? '/icons/logo-white.svg' : '/images/logo.svg';
  const logoLanguage = isSecureSection ? '/icons/language-white.svg' : '/icons/world.svg';

  return (
    <header
      ref={headerRef}
      className={`w-full fixed top-0 z-40 ${isSecureSection ? 'bg-secondary-db-100' : 'bg-white border-b border-gray-200'}`}
    >
      {showBanner && ctaIndex !== null && (() => {
        const cta = ctaVariations[ctaIndex];
        return (
          <div className="w-full bg-primary-way-100 text-white text-center py-2 text-sm relative">
            {cta.text}{' '}
            <Link href={cta.link} className="underline">
              {cta.linkText}
            </Link>
            <button
              onClick={() => setShowBanner(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label="Close banner"
            >
              <div className="bg-white/10 p-2 rounded-lg">
                <Image src="/icons/close.svg" alt="Close" title="Close" width={10} height={10} />
              </div>
            </button>
          </div>
        );
      })()}

      <nav className="mx-auto px-4 md:px-16 z-40">
        <div className="flex justify-between items-center h-16 md:h-16">
          {/* Logo */}
          <Link href="/" className="block flex items-center space-x-2" aria-label="Waysorted Home">
            <div className="relative w-24 h-8 sm:w-28 sm:h-9 md:w-32 md:h-10 lg:w-36 lg:h-11 translate-y-1">
              <Image
                src={logoSrc}
                alt="WaySorted Logo"
                title="WaySorted Logo"
                fill
                className="hidden md:block object-contain"
                priority
              />
              <Image
                src={isSecureSection ? '/icons/logo-white.svg' : '/images/blue-logo.png'}
                alt="WaySorted Logo"
                title="WaySorted Logo"
                fill
                className="block md:hidden object-contain"
                sizes="(max-width: 768px) 150px, 200px"
                priority
              />
            </div>
            <div className='text-xs font-medium text-primary-way-100 border border-primary-way-100 rounded-3xl inline block py-1 px-2 translate-y-[-4px]'>BETA</div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-5 pl-6 lg:pl-12">
            <div
              className={`relative flex items-center space-x-1 font-medium text-sm cursor-pointer ${textColor}`}
              onMouseEnter={() => {
                // Ensure accordion-like behavior on desktop: opening Products closes Resources
                setProductsOpen(true);
                setResourcesOpen(false);
              }}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <span>Products</span>
              <Badge variant="tertiary-orange-500">New</Badge>
              <Image
                src="/icons/chevron-down.svg"
                alt="Chevron Down"
                title="Chevron Down"
                width={8}
                height={4}
                className={`transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`}
              />
              <ProductsMenu isOpen={productsOpen} className="absolute translate-x-[-20%] top-full pt-4" />
            </div>

            <div
              className={`relative flex items-center space-x-1 font-medium text-sm cursor-pointer ${textColor}`}
              onMouseEnter={() => {
                // Ensure accordion-like behavior on desktop: opening Resources closes Products
                setResourcesOpen(true);
                setProductsOpen(false);
              }}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <span>Resources</span>
              <Image
                src="/icons/chevron-down.svg"
                alt="Chevron Down"
                title="Chevron Down"
                width={8}
                height={4}
                className={`transition-transform duration-300 ${resourcesOpen ? 'rotate-180' : ''}`}
              />
              <ResourcesMenu
                isOpen={resourcesOpen}
                className="absolute translate-x-[-20%] top-full pt-4"
              />
            </div>

            <button
              className={`flex items-center pr-3 font-medium text-sm cursor-pointer ${textColor}`}
              onClick={() => router.push('/about-us')}
            >
              About Us
            </button>

            <button
              className={`flex items-center pr-3 font-medium text-sm cursor-pointer ${textColor}`}
              onClick={() => router.push('/support')}
            >
              Support
            </button>


          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Mobile: user initials chip + menu button (order matches screenshot) */}
            {user && (
              <div className="md:hidden">
                {/* Renders its own trigger; appears as an initials chip */}
                <UserMenu user={user} handleLogout={handleLogout} />
              </div>
            )}

            {/* Language: hide on mobile, available inside drawer */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setLanguageOpen((prev) => !prev)}
                className={`border border-secondary-db-20 rounded-lg p-2 active:scale-95 transition-transform duration-100 cursor-pointer ${isSecureSection ? 'border border-secondary-db-80' : ''}`}
                title="Change Language"
                aria-label="Change Language"
                ref={languageBtnRef}
              >
                <Image src={logoLanguage} alt="Globe Icon" title="Globe Icon" width={20} height={20} />
              </button>
              <LanguageDropdown
                isOpen={languageOpen}
                onClose={() => setLanguageOpen(false)}
                buttonRef={languageBtnRef}
              />
            </div>

            {/* Auth buttons: desktop only */}
            {!user ? (
              <button
                className={`md:inline-flex md:font-medium text-sm md:text-base border border-secondary-db-20 rounded-lg px-3 py-1.25 md:px-5 md:py-2 cursor-pointer transition-colors active:scale-95 ${isSecureSection ? 'text-white border-secondary-db-80' : 'text-secondary-db-100'}`}
                title="Sign Up"
                onClick={() => router.push('/signup')}
                aria-label="Sign Up"
              >
                Sign Up
              </button>
            ) : (
              <div className="hidden md:block">
                <UserMenu user={user} handleLogout={handleLogout} />
              </div>
            )}

            {/* Hamburger: mobile only */}
            <button
              type="button"
              className="md:hidden border border-secondary-db-20 rounded-lg p-2 active:scale-95 transition-transform duration-100 cursor-pointer"
              aria-label="Open menu"
              aria-controls="mobile-drawer"
              onClick={() => setMobileOpen(true)}
            >
              <Image src="/icons/menu.svg" alt="Open menu" title="Open menu" width={22} height={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer (centered like user settings) */}
      <div
        id="mobile-drawer"
        className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'
            }`}
          // Also close on overlay click (though aside might cover it)
          onClick={() => setMobileOpen(false)}
        />

        {/* Centered panel container */}
        <aside
          className="absolute inset-0 flex items-start justify-center pt-[72px] px-2"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-drawer-title"
          // Close when clicking outside the card content
          onClick={() => setMobileOpen(false)}
        >
          {/* Card */}
          <div
            // Stop propagation so clicks inside the card don't close the drawer
            onClick={(e) => e.stopPropagation()}
            className={`relative h-[calc(100%-64px)] w-full max-w-[420px] bg-white border border-secondary-db-20 rounded-2xl shadow-xl flex flex-col overflow-hidden transition-all duration-200 ${mobileOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-95'
              }`}
          >
            {/* Scrollable content (no title row per design) */}
            <nav className="flex-1 overflow-y-auto">
              {/* Products row */}
              <div className="px-3">
                <button
                  className="w-full flex items-center gap-2 px-3 py-4 text-secondary-db-100"
                  onClick={() =>
                    // Accordion behavior on mobile: opening Products closes Resources
                    setMobileProductsOpen((prev) => {
                      const next = !prev;
                      if (next) setMobileResourcesOpen(false);
                      return next;
                    })
                  }
                >
                  <span className="font-medium">Products</span>
                  <Badge variant="tertiary-orange-500">New</Badge>
                  <Image
                    src="/icons/chevron-down.svg"
                    alt="Toggle Products"
                    title="Toggle Products"
                    width={12}
                    height={12}
                    className={`ml-1 transition-transform duration-300 ${mobileProductsOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className="border-t border-primary-way-10" />
              </div>

              {/* Products panel */}
              <div
                id="mobile-products-panel"
                className={`overflow-hidden transition-[max-height,opacity] duration-300 ${mobileProductsOpen ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <ul className="mt-2 px-3 space-y-2">
                  {products.map((p) => (
                    <li key={p.name}>
                      <button
                        onClick={() => {
                          router.push(p.href);
                          setMobileOpen(false);
                          setMobileProductsOpen(false);
                        }}
                        className="w-full text-left flex items-start gap-3 rounded-xl border border-primary-way-10 bg-primary-way-5 px-3 py-3 active:scale-[0.99]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-way-50/30">
                          {p.icon ? (
                            <Image src={p.icon} alt={p.name} title={p.name} width={40} height={40} />
                          ) : (
                            <span className="text-lg">✨</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-secondary-db-100">{p.name}</div>
                          <div className="text-xs text-secondary-db-60 line-clamp-2">{p.description}</div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 px-3">
                  <div className="border-t border-primary-way-10" />
                </div>
              </div>

              {/* Resources row */}
              <div className="px-3">
                <button
                  className="w-full flex items-center gap-2 px-3 py-4 text-secondary-db-100"
                  onClick={() =>
                    // Accordion behavior on mobile: opening Resources closes Products
                    setMobileResourcesOpen((prev) => {
                      const next = !prev;
                      if (next) setMobileProductsOpen(false);
                      return next;
                    })
                  }
                >
                  <span className="font-medium">Resources</span>
                  <Image
                    src="/icons/chevron-down.svg"
                    alt="Toggle Resources"
                    title="Toggle Resources"
                    width={12}
                    height={12}
                    className={`ml-1 transition-transform duration-300 ${mobileResourcesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div className="border-t border-primary-way-10" />
              </div>

              {/* Resources panel */}
              <div
                id="mobile-resources-panel"
                className={`overflow-hidden transition-[max-height,opacity] duration-300 ${mobileResourcesOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="px-3">
                  <div className="mt-2 rounded-xl border border-primary-way-10 bg-primary-way-5 overflow-hidden">
                    <button
                      className="w-full text-left px-4 py-3 text-secondary-db-100 border-b border-primary-way-10"
                      onClick={() => {
                        router.push('/learning');
                        setMobileOpen(false);
                        setMobileResourcesOpen(false);
                      }}
                    >
                      Learning Hub
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 text-secondary-db-100 border-b border-primary-way-10"
                      onClick={() => {
                        router.push('/document-hub/getting-started');
                        setMobileOpen(false);
                        setMobileResourcesOpen(false);
                      }}
                    >
                      Document Hub
                    </button>
                  </div>
                </div>
                <div className="mt-3 px-3">
                  <div className="border-t border-primary-way-10" />
                </div>
              </div>
              <div className="px-3">
                <button
                  className="w-full flex items-center gap-2 px-3 py-4 text-secondary-db-100"
                  onClick={() => { router.push('/about-us') }}
                >
                  <span className="font-medium">About Us</span>
                </button>
                <div className="border-t border-primary-way-10" />
              </div>
              <div className="px-3">
                <button
                  className="w-full flex items-center gap-2 px-3 py-4 text-secondary-db-100"
                  onClick={() => { router.push('/support') }}
                >
                  <span className="font-medium">Support</span>
                </button>
                <div className="border-t border-primary-way-10" />
              </div>

              {/* Language pill + dropdown */}
              <div className="px-3 py-4">
                <button
                  ref={mobileLanguageBtnRef}
                  onClick={() => setLanguageOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-secondary-db-20 px-3 py-1.5 active:scale-95"
                  title="Change Language"
                  aria-label="Change Language"
                  aria-controls="mobile-language"
                >
                  <Image src={logoLanguage} alt="Language" title="Language" width={16} height={16} />
                  <span className="text-secondary-db-100 text-sm">En</span>
                </button>
                <div id="mobile-language" className="relative mt-2">
                  <LanguageDropdown
                    isOpen={languageOpen}
                    onClose={() => setLanguageOpen(false)}
                    buttonRef={mobileLanguageBtnRef}
                  />
                </div>
              </div>
            </nav>

            <div
              className="sticky bottom-0 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-t border-primary-way-10 px-4 py-3"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
            >
              <button
                onClick={() => { router.push('/mobile-redirect'); setMobileOpen(false); setMobileProductsOpen(false); setMobileResourcesOpen(false); }}
                className="w-full inline-flex items-center justify-between rounded-lg bg-primary-way-100 text-white px-4 py-3 font-medium active:scale-[0.98]"
              >
                <span>Request a feature</span>
                <Image src="/icons/arrow-right-white.svg" alt="" width={18} height={18} />
              </button>
            </div>



          </div>
          {mobileOpen && (
            <button
              aria-label="Close menu"
              onClick={(e) => {
                e.stopPropagation();
                setMobileOpen(false);
              }}
              className="absolute left-1/2 top-4 -translate-x-1/2 z-[60] h-12 w-12 rounded-full flex items-center justify-center bg-neutral-800/70 text-white border border-white/40 ring-1 ring-white/30 shadow-2xl backdrop-blur p-0 leading-none"
            >
              <Image src="/icons/close.svg" alt="Close menu" title="Close menu" width={18} height={18} />
            </button>
          )}
        </aside>
      </div >
    </header >
  );
};

export default Header;