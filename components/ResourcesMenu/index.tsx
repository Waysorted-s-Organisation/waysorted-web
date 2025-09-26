"use client"
import Image from 'next/image';
import { useRouter } from "next/navigation";

interface ResourcesMenuProps {
  isOpen: boolean;
  className?: string;
}

export default function ResourcesMenu({ isOpen, className }: ResourcesMenuProps) {
  const router = useRouter();
  const handleClick = (link: string) => () => {
    router.push(`/${link}`);
  };
  return (
    <div
      className={`absolute top-full mt-2 w-[281px] bg-white rounded-xl menu-shadow overflow-hidden ${className} transition-all duration-300 origin-top 
        ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}
    >
      {/* Top section */}
      <div className="flex flex-col p-2 rounded-md bg-white m-2">
        {[
          { title: 'Learning', link:'learning', desc: 'Quick tips and tutorials to get you started fast.', icon: '/icons/learning.svg' },
          { title: 'Documentation', link:'documents', desc: 'Everything you need, explained in detail.', icon: '/icons/documentation.svg' },
        ].map((item, idx) => (
          <button
            key={idx}
            className="flex items-center space-x-3 rounded-lg hover:bg-primary-way-10 cursor-pointer p-2 w-full text-left focus:outline-primary-way-10"
            onClick={handleClick(item.link)}
          >
            <div className="flex-shrink-0 rounded-md">
              <Image src={item.icon} alt={item.title} width={60} height={60} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-normal text-sm text-secondary-db-100 leading-none mb-1">
                {item.title}
              </p>
              <p className="text-[10px] text-secondary-db-70 font-medium leading-tight">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
