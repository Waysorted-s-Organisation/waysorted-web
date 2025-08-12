import Image from 'next/image';

interface ResourcesMenuProps {
  isOpen: boolean;
  className?: string;
}

export default function ResourcesMenu({ isOpen, className }: ResourcesMenuProps) {
  return (
    <div
      className={`absolute top-full mt-2 w-[749px] bg-white rounded-xl menu-shadow overflow-hidden ${className} transition-all duration-300 origin-top 
        ${isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`}
    >
      {/* Top section */}
      <div className="grid grid-cols-3 gap-3 p-2 rounded-md bg-menu-bg m-2">
        {[
          { title: 'Learning', desc: 'Lorem ipsum dolor sit amet, consec tetur elit uspendisse.', icon: '/icons/learning.svg' },
          { title: 'Documentation', desc: 'Lorem ipsum dolor sit amet, consec tetur elit uspendisse.', icon: '/icons/documentation.svg' },
          { title: 'Security', desc: 'Lorem ipsum dolor sit amet, consec tetur elit uspendisse.', icon: '/icons/security.svg' },
          { title: 'About us', desc: 'Lorem ipsum dolor sit amet, consec tetur elit uspendisse.', icon: '/icons/about.svg' },
        ].map((item, idx) => (
          <button
            key={idx}
            className="flex items-center space-x-3 rounded-lg hover:bg-white cursor-pointer p-2 w-full text-left focus:outline-none"
          >
            <div className="flex-shrink-0 rounded-md">
              <Image src={item.icon} alt={item.title} width={60} height={60} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-normal text-sm text-primary-dark leading-none mb-1">
                {item.title}
              </p>
              <p className="text-[10px] text-primary-dark-70 font-medium leading-tight">
                {item.desc}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom blog preview section */}
      <div className="blog-preview h-[133px] m-2 rounded-md">
        <p className="text-center text-gray-700">Blog preview section here</p>
      </div>
    </div>
  );
}
