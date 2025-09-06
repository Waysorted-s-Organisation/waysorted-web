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

  const languages = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean']

  useEffect(() => {
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

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg p-2 z-50"
    >
      <div className="grid grid-cols-2 gap-x-4">
        {languages.map((lang) => (
          <button
            key={lang}
            onClick={() => {
              setSelected(lang)
              onClose()
            }}
            className={`flex items-center text-base font-medium justify-between px-2 py-1 rounded hover:bg-gray-100 ${
              lang === selected ? 'border border-gray-300' : ''
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
