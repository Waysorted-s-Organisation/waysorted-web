"use client"
import Image from 'next/image';
import Link from 'next/link';

interface ResourcesMenuProps {
  isOpen: boolean;
  className?: string;
}

export default function ResourcesMenu({ isOpen, className }: ResourcesMenuProps) {
  const menuItems = [
    { title: 'Learning Hub', link: 'learning', desc: 'Quick tips and tutorials to get you started fast.', icon: '/icons/learning.svg' },
    { title: 'Document Hub', link: 'document-hub/getting-started', desc: 'Everything you need, explained in detail.', icon: '/icons/documentation.svg' },
    { title: 'Blogs', link: 'blogs', desc: 'Guides, ideas, and updates from Waysorted.', icon: '/icons/learning.svg' },
    // Was 'notes', which 404s - the route is /release-notes.
    { title: 'Release Notes', link: 'release-notes', desc: 'Discover What\'s new & Enhancements.', icon: '/icons/release-notes.svg' }
  ];

  return (
    <div
      className={`absolute top-full w-[580px] bg-white rounded-lg menu-shadow overflow-hidden ${className} transition-all duration-300 origin-top 
        ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}
    >
      <div className="grid grid-cols-2 gap-2 p-2 rounded-md bg-white m-2">
        {menuItems.map((item, idx) => (
          <Link
            key={idx}
            href={`/${item.link}`}
            className="flex items-start space-x-3 rounded-lg hover:bg-primary-way-20 cursor-pointer p-2 w-full text-left focus:outline-primary-way-20 transition-colors"
          >
            <div className="flex-shrink-0 rounded-md">
              <Image src={item.icon} alt={item.title} title={item.title} width={57} height={57} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-normal text-sm text-secondary-db-100 leading-none mb-1">
                {item.title}
              </p>
              <p className="text-[10px] text-secondary-db-70 font-medium leading-tight">
                {item.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
