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
import GlowingStarButton from '@/components/GlowStarButton';

interface HeaderProps {
  showBanner: boolean;
  setShowBanner: (value: boolean) => void;
}

const Header = ({ showBanner, setShowBanner }: HeaderProps) => {
  const { user, loading, refetch } = useUser();
  const [productsOpen, setProductsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const languageBtnRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

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

  // Close menus on route change
  useEffect(() => {
    const closeAll = () => {
      setProductsOpen(false);
      setResourcesOpen(false);
      setLanguageOpen(false);
      setMobileOpen(false);
    };
    // Using popstate as a lightweight way to detect back/forward; Next router.refresh is not evented
    window.addEventListener('popstate', closeAll);
    return () => window.removeEventListener('popstate', closeAll);
  }, []);

  // Close mobile drawer on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setLanguageOpen(false);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="w-full bg-white border-b border-gray-200 fixed top-0 z-40">
      {showBanner && (
        <div className="w-full bg-primary-way-100 text-white text-center py-2 text-sm relative">
          Get early access to Waysorted Figma...{' '}
          <Link href="/get-early-access" className="underline">
            Click here
          </Link>
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
            aria-label="Close banner"
          >
            <div className="bg-white/10 p-2 rounded-lg">
              <Image src="/icons/close.svg" alt="Close" width={10} height={10} />
            </div>
          </button>
        </div>
      )}

      <nav className="mx-auto px-4 md:px-16 z-40">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="block">
            <div className="relative w-24 h-8 sm:w-28 sm:h-9 md:w-32 md:h-10 lg:w-36 lg:h-11 translate-y-1">
              <Image
                src="/images/logo.svg"
                alt="WaySorted Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-5 pl-6 lg:pl-12">
            <div
              className="relative flex items-center space-x-1 text-secondary-db-100 font-medium text-sm cursor-pointer"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <span>Products</span>
              <Badge variant="tertiary-orange-500">New</Badge>
              <Image
                src="/icons/chevron-down.svg"
                alt="Chevron Down"
                width={8}
                height={4}
                className={`transition-transform duration-300 ${productsOpen ? 'rotate-180' : ''}`}
              />
              <ProductsMenu isOpen={productsOpen} className="absolute translate-y-4" />
            </div>

            <div
              className="relative flex items-center space-x-1 text-secondary-db-100 font-medium text-sm cursor-pointer"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <span>Resources</span>
              <Image
                src="/icons/chevron-down.svg"
                alt="Chevron Down"
                width={8}
                height={4}
                className={`transition-transform duration-300 ${resourcesOpen ? 'rotate-180' : ''}`}
              />
              <ResourcesMenu
                isOpen={resourcesOpen}
                className="absolute translate-x-[-20%] translate-y-4"
              />
            </div>

            <button
              className="flex items-center pr-3 text-secondary-db-100 font-medium text-sm cursor-pointer"
              onClick={() => router.push('/about-us')}
            >
              About Us
            </button>

            <button
              className="flex items-center pr-3 text-secondary-db-100 font-medium text-sm cursor-pointer"
              onClick={() => router.push('/support')}
            >
              Support
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">

            {/* Language: hide on mobile, available inside drawer */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="border border-secondary-db-20 rounded-lg p-2 active:scale-95 transition-transform duration-100 cursor-pointer"
                title="Change Language"
                aria-label="Change Language"
                ref={languageBtnRef}
              >
                <Image src="/icons/world.svg" alt="Globe Icon" width={20} height={20} />
              </button>
              <LanguageDropdown
                isOpen={languageOpen}
                onClose={() => setLanguageOpen(false)}
                buttonRef={languageBtnRef}
              />
            </div>

            {/* Primary CTA */}
            <GlowingStarButton
              className="bg-secondary-db-100 shadow-glow font-medium text-sm md:text-base text-white px-4 md:px-5 py-2 rounded-lg flex items-center active:scale-95 transition-colors duration-100 cursor-pointer"
              title="Get Early Access"
              aria-label="Get Early Access"
              onClick={() => router.push('/get-early-access')}
              disabled={!!user?.earlyAccess}
            >
              <span>Get Early Access</span>
            </GlowingStarButton>

            {/* Auth buttons: desktop in top bar, mobile moved to drawer */}
            {!loading && !user && (
              <button
                className="hidden md:inline-flex text-secondary-db-100 font-medium text-base border border-secondary-db-20 rounded-lg px-5 py-2 cursor-pointer transition-colors active:scale-95"
                title="Sign Up"
                onClick={() => router.push('/signup')}
                aria-label="Sign Up"
              >
                Sign Up
              </button>
            )}

            {user && <div className="hidden md:block"><UserMenu user={user} handleLogout={handleLogout} /></div>}

            {/* Hamburger: mobile only */}
            <button
              type="button"
              className="md:hidden border border-secondary-db-20 rounded-lg p-2 active:scale-95 transition-transform duration-100 cursor-pointer"
              aria-label="Open menu"
              aria-controls="mobile-drawer"
              onClick={() => setMobileOpen(true)}
            >
              <Image src="/icons/menu.svg" alt="Open menu" width={22} height={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        id="mobile-drawer"
        className={`md:hidden fixed inset-0 z-50 ${mobileOpen ? '' : 'pointer-events-none'}`}
      >
        {/* Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white shadow-xl transition-transform duration-200 ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-base font-medium">Menu</span>
            <button
              aria-label="Close menu"
              className="border border-secondary-db-20 rounded-lg p-2"
              onClick={() => setMobileOpen(false)}
            >
              <Image src="/icons/close.svg" alt="Close menu" width={16} height={16} />
            </button>
          </div>

          <nav className="p-2">
            <button
              className="w-full flex items-center justify-between px-4 py-3 text-secondary-db-100"
              onClick={() => {
                router.push('/products');
                setMobileOpen(false);
              }}
            >
              <span className="font-medium">Products</span>
              <Badge variant="tertiary-orange-500">New</Badge>
            </button>

            <button
              className="w-full text-left px-4 py-3 text-secondary-db-100"
              onClick={() => {
                router.push('/resources');
                setMobileOpen(false);
              }}
            >
              <span className="font-medium">Resources</span>
            </button>

            <button
              className="w-full text-left px-4 py-3 text-secondary-db-100"
              onClick={() => {
                router.push('/about-us');
                setMobileOpen(false);
              }}
            >
              <span className="font-medium">About Us</span>
            </button>

            <button
              className="w-full text-left px-4 py-3 text-secondary-db-100"
              onClick={() => {
                router.push('/support');
                setMobileOpen(false);
              }}
            >
              <span className="font-medium">Support</span>
            </button>

            <div className="my-2 border-t" />

            {/* Language switch inside drawer */}
            <button
              onClick={() => {
                setLanguageOpen((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-secondary-db-100"
              title="Change Language"
              aria-label="Change Language"
              aria-controls="mobile-language"
            >
              <span className="font-medium">Language</span>
              <Image src="/icons/world.svg" alt="Language" width={18} height={18} />
            </button>
            {/* Reuse dropdown positioned statically on mobile */}
            <div id="mobile-language" className="px-4">
              <LanguageDropdown
                isOpen={languageOpen}
                onClose={() => setLanguageOpen(false)}
                buttonRef={languageBtnRef}
              />
            </div>

            <div className="my-2 border-t" />

            {/* Auth actions */}
            {!loading && !user && (
              <div className="px-4 py-3 flex gap-3">
                <button
                  className="flex-1 text-secondary-db-100 font-medium border border-secondary-db-20 rounded-lg px-4 py-2 active:scale-95"
                  onClick={() => {
                    router.push('/signup');
                    setMobileOpen(false);
                  }}
                >
                  Sign Up
                </button>
                <button
                  className="flex-1 bg-secondary-db-100 text-white font-medium rounded-lg px-4 py-2 active:scale-95"
                  onClick={() => {
                    router.push('/login');
                    setMobileOpen(false);
                  }}
                >
                  Log In
                </button>
              </div>
            )}

            {user && (
              <div className="px-4 py-3">
                <UserMenu user={user} handleLogout={() => { setMobileOpen(false); handleLogout(); }} />
              </div>
            )}
          </nav>
        </aside>
      </div>
    </header>
  );
};

export default Header;