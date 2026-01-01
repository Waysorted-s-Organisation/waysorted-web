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
    // Read cookie on mount to set initial state
    const getCookie = (name: string) => {
      const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? v[2] : null;
    };

    const googtrans = getCookie('googtrans');
    if (googtrans === '/en/hi') {
      setSelected('Hindi');
    } else {
      setSelected('English');
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
    if (lang === selected) {
      onClose();
      return;
    }

    setSelected(lang);
    onClose();

    // Google Translate Cookie Logic
    if (lang === 'Hindi') {
      document.cookie = "googtrans=/en/hi; path=/";
      document.cookie = "googtrans=/en/hi; path=/; domain=" + document.domain;
    } else {
      // Clear/Reset to English
      document.cookie = "googtrans=/en/en; path=/";
      document.cookie = "googtrans=/en/en; path=/; domain=" + document.domain;
    }

    // Reload to apply translation
    window.location.reload();
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
