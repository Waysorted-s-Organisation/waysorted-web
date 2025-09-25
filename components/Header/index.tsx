'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Badge from '../Badge'
import {ProductsMenu} from '../ProductsMenu'
import ResourcesMenu from '../ResourcesMenu'
import LanguageDropdown from '../LanguageDropdown'
import { useRouter } from "next/navigation";

interface HeaderProps {
  showBanner: boolean;
  setShowBanner: (value: boolean) => void;
}

const Header = ({showBanner, setShowBanner}: HeaderProps) => {
  const [productsOpen, setProductsOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const router = useRouter();


  return (
    <header className="w-full bg-white border-b border-gray-200 fixed top-0 z-40">
      {/* Top banner */}
      {showBanner && (
        <div className="w-full bg-primary-way-100 text-white text-center py-2 text-sm relative">
          Get early access to Waysorted Figma...<Link href="/get-early-access" className="underline">Click here</Link>
          {/* Close button */}
          <button
            onClick={() => setShowBanner(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
            aria-label="Close banner"
          >
            <div className='bg-white/10 p-2 rounded-lg'>
            <Image
              src="/icons/close.svg"
              alt="Close"
              width={10}
              height={10}
              className=""
            />
            </div>
          </button>
        </div>
      )}

      {/* Main header */}
      <nav className="mx-auto px-6 md:px-16 z-40">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="block">
            <div className="relative w-24 h-8 sm:w-28 sm:h-9 md:w-32 md:h-10 lg:w-36 lg:h-11 translate-y-1">
              <Image
                src="/images/logo.svg"
                alt="WaySorted Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center space-x-5 pl-12">
            {/* Products */}
            <div
              className="relative flex items-center space-x-1 text-secondary-db-100 font-medium text-sm cursor-pointer"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <span>Products</span>
              <Badge variant='tertiary-orange-500'>New</Badge>
              <Image
                src="/icons/chevron-down.svg"
                alt="Chevron Down"
                width={8}
                height={4}
                className={`transition-transform duration-300 ${
                  productsOpen ? 'rotate-180' : ''
                }`}
              />
              <ProductsMenu isOpen={productsOpen} className="absolute translate-y-4" />
            </div>

            {/* Resources */}
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
              <ResourcesMenu isOpen={resourcesOpen} className="absolute translate-x-[-20%] translate-y-4" />
            </div>
            {/* About Us */}
            <button className="flex items-center pr-3 text-secondary-db-100 font-medium text-sm cursor-pointer"
            onClick={() => router.push("/about-us")}
            >
              About Us
            </button>

            {/* Support */}
            <button className="flex items-center pr-3 text-secondary-db-100 font-medium text-sm cursor-pointer"
            onClick={() => router.push("/support")}
            >
              Support
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2">
            {/* Light mode toggle */}
            <button
              className="border border-secondary-db-20 rounded-lg p-2 active:scale-95 transition-transform duration-100 cursor-pointer"
              title="Toggle Light Mode"
              aria-label="Toggle Light Mode"
            >
              <Image
                src="/icons/light.svg"
                alt="Light Mode"
                width={20}
                height={20}
                className="cursor-pointer"
              />
            </button>
            <div className="relative">
              <button
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="border border-secondary-db-20 rounded-lg p-2 active:scale-95 transition-transform duration-100 cursor-pointer"
                title="Change Language"
                aria-label="Change Language"
              >
                <Image
                  src="/icons/world.svg"
                  alt="Globe Icon"
                  width={20}
                  height={20}
                  className="cursor-pointer"
                />
              </button>

              {/* Language dropdown */}
              <LanguageDropdown
                isOpen={languageOpen}
                onClose={() => setLanguageOpen(false)}
                buttonRef={buttonRef}
              />
            </div>

            <button
              className="bg-secondary-db-100 font-medium text-base text-white px-5 py-2 rounded-lg flex items-center active:scale-95 transition-colors duration-100 cursor-pointer"
              title="Get Early Access"
              aria-label="Get Early Access"
              onClick={() => router.push("/get-early-access")}
            >
              <span>Get Early Access</span>
            </button>

            {/* Login button */}
            <button
              className="text-secondary-db-100 font-medium text-base border border-secondary-db-20 rounded-lg px-5 py-2 cursor-pointer transition-colors active:scale-95"
              title="Sign Up"
              onClick={() => router.push("/signup")}
              aria-label="Sign Up"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
