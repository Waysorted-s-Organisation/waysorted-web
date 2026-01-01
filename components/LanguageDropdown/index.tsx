'use client'
import { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'

const LanguageDropdown = ({
  isOpen,
  onClose,
  buttonRef
}: {
  isOpen: boolean,
  onClose: () => void,
  buttonRef: React.RefObject<HTMLButtonElement | null>
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState('English')

  const languages = ['English', 'Hindi']

  useEffect(() => {
    // Check URL query param for language state
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang');

    const clearCookies = () => {
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "googtrans=; path=/; domain=" + document.domain + "; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "googtrans=; path=/; domain=." + document.domain + "; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    };

    if (langParam === 'hi') {
      setSelected('Hindi');
      // Ensure cookie is set if param is present
      document.cookie = "googtrans=/en/hi; path=/";
      document.cookie = "googtrans=/en/hi; path=/; domain=" + document.domain;
    } else {
      setSelected('English');
      // If no param, ensure cookies are cleared (Default / Refresh behavior)
      // We only clear if cookie exists to avoid unnecessary processing/reloads loop checks
      if (document.cookie.includes('googtrans=/en/hi')) {
        clearCookies();
        window.location.reload();
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, buttonRef])

  const handleLanguageChange = (lang: string) => {
    onClose();

    if (lang === 'Hindi') {
      if (selected === 'Hindi') return;

      document.cookie = "googtrans=/en/hi; path=/";
      document.cookie = "googtrans=/en/hi; path=/; domain=" + document.domain;

      // Add ?lang=hi to URL
      const url = new URL(window.location.href);
      url.searchParams.set('lang', 'hi');
      window.location.href = url.toString();
    } else {
      if (selected === 'English') return;

      // Clear cookies
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "googtrans=; path=/; domain=" + document.domain + "; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
      document.cookie = "googtrans=; path=/; domain=." + document.domain + "; expires=Thu, 01 Jan 1970 00:00:00 UTC;";

      // Remove ?lang=hi from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('lang');
      window.location.href = url.toString();
    }
  };

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-3 w-56 bg-white rounded-md shadow-lg p-2 z-50"
    >
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        {languages.map((lang) => (
          <button
            key={lang}
            // Use onMouseDown to prevent focus stealing issues with Google Translate iframe
            onMouseDown={(e) => {
              e.preventDefault();
              handleLanguageChange(lang);
            }}
            onClick={() => handleLanguageChange(lang)}
            className={`flex items-center text-base font-medium justify-between px-5 py-1 rounded cursor-pointer ${lang === selected ? 'border border-secondary-db-100' : ''
              }`}
          >
            <span>{lang}</span>
            {lang === selected && <Check className="w-4 h-4 text-secondary-db-100" />}
          </button>
        ))}
      </div>
    </div>
  )
}

export default LanguageDropdown
