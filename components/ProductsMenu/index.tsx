'use client'
import Image from 'next/image'
import Link from 'next/link'
import products from "@/data/products.json"
import { useRouter } from 'next/navigation'

export interface ProductsMenuProps {
  isOpen: boolean;
  className?: string;
}

export const ProductsMenu: React.FC<ProductsMenuProps> = ({ isOpen, className }) => {
  const router = useRouter()
  return (
    <div
      className={`products-menu absolute top-full mt-2 w-[780px] 
        bg-white menu-shadow rounded-xl overflow-hidden ${className}
        transition-all duration-300 origin-top
        ${isOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"}`}
    >
      {/* Grid area with bg-menu-bg */}
      <div className="bg-white grid grid-cols-3 max-h-[240px] rounded-md overflow-y-auto custom-scrollbar m-2">
        {products.map(product => (
          <Link
            key={product.id}
            href={product.href}
            className="flex space-x-3 p-2 rounded-xl bg-white hover:bg-primary-way-10 hover:ring-2 hover:ring-primary-way-10 transition-colors mx-2 my-2"
          >
              <Image
              src={product.icon}
              alt={product.name}
              width={57}
              height={57}
              className=""
            />
            
            <div>
              <p className="font-normal text-sm text-secondary-db-100">
                {product.name}
              </p>
              <p className="text-[10px] font-medium text-secondary-db-70">
                {product.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA section */}
      <div
        className="bg-primary-way-100 p-4 m-2 rounded-md flex items-center justify-between cursor-pointer"
        onClick={() => router.push('/request')}
        title="Request a Feature"
      >
        <span className="text-white font-medium hover:underline">
          Request a Feature
        </span>
        <Image
          src="/icons/arrow-right-white.svg"
          alt="Arrow Right"
          width={16}
          height={16}
          className="inline-block"
        />
      </div>

    </div>
  );
};
