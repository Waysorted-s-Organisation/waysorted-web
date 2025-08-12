'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import Badge from '../Badge'
import {ProductsMenu} from '../ProductsMenu'
import ResourcesMenu from '../ResourcesMenu'
import LanguageDropdown from '../LanguageDropdown'

const Header = () => {
  const [productsOpen, setProductsOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)


  return (
    <header className="w-full bg-white border-b border-gray-200 fixed top-0 z-50">
      {/* Top banner */}
      <div className="w-full bg-primary-dark text-white text-center py-2 text-sm">
        Get a FREE Unlimited personal file editors
      </div>

      {/* Main header */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="hidden md:flex items-center space-x-8">
            {/* Products */}
            <div
              className="relative flex items-center space-x-1 text-primary-dark font-medium text-sm cursor-pointer"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <span>Products</span>
              <Badge variant='orange'>New</Badge>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${
                  productsOpen ? 'rotate-180' : ''
                }`}
              />
              <ProductsMenu isOpen={productsOpen} className="absolute translate-y-4" />
            </div>

            {/* Resources */}
            <div
              className="relative flex items-center space-x-1 text-primary-dark font-medium text-sm cursor-pointer"
              onMouseEnter={() => setResourcesOpen(true)}
              onMouseLeave={() => setResourcesOpen(false)}
            >
              <span>Resources</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-300 ${resourcesOpen ? 'rotate-180' : ''}`}
              />
              <ResourcesMenu isOpen={resourcesOpen} className="absolute translate-x-[-20%] translate-y-4" />
            </div>


            {/* Support */}
            <div className="flex items-center space-x-1 text-primary-dark font-medium text-sm cursor-pointer">
              <span>Support</span>
            </div>

            {/* Pricing */}
            <div className="flex items-center space-x-1 text-primary-dark font-medium text-sm cursor-pointer">
              <span>Pricing</span>
              <Badge variant="blue">Save upto 90%</Badge>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Light mode toggle */}
            <button
              className="border border-primary-dark-20 rounded-lg p-2 active:scale-95 transition-transform duration-100 cursor-pointer"
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

            {/* Login button */}
            <button
              className="text-primary-dark font-medium text-base border border-primary-dark-20 rounded-lg px-4 py-2 cursor-pointer transition-colors active:scale-95"
              title="Log in or Sign up"
              aria-label="Log in or Sign up"
            >
              Log in / Sign up
            </button>

            {/* Figma plugin */}
            <button
              className="bg-primary-dark font-medium text-base text-white px-4 py-2 rounded-lg flex items-center space-x-2 active:scale-95 transition-colors duration-100 cursor-pointer"
              title="Open Figma Plugin"
              aria-label="Open Figma Plugin"
            >
              <Image
                src="/icons/figma.svg"
                alt="Figma Icon"
                width={14}
                height={14}
                className="cursor-pointer"
              />
              <span>Open Plugin</span>
            </button>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLanguageOpen((prev) => !prev)}
                className="bg-primary-dark p-2 rounded-lg hover:brightness-110 active:scale-95 transition-all"
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
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
