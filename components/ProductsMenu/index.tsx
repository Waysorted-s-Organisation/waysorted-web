'use client'
import Image from 'next/image'
import Link from 'next/link'
import products from "@/data/products.json"

export interface ProductsMenuProps {
  isOpen: boolean;
  className?: string;
}

export const ProductsMenu: React.FC<ProductsMenuProps> = ({ isOpen, className }) => {
  return (
    <div
      className={`products-menu absolute top-full mt-2 w-[800px] 
        bg-menu-bg menu-shadow rounded-xl overflow-hidden ${className}
        transition-all duration-300 origin-top
        ${isOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'}`}
    >
      {/* Grid area with bg-menu-bg */}
      <div className="bg-primary-light grid grid-cols-3 max-h-[240px] rounded-md overflow-y-auto custom-scrollbar m-2">
        {products.map(product => (
          <Link
            key={product.id}
            href={product.href}
            className="flex space-x-3 p-2 rounded-xl bg-menu-bg hover:bg-white transition-colors mx-2 my-2"
          >
            <Image
              src={product.icon}
              alt={product.name}
              width={40}
              height={40}
              className="rounded-md"
            />
            <div>
              <p className="font-normal text-sm text-primary-dark">{product.name}</p>
              <p className="text-[10px] font-medium text-primary-dark-70">{product.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* CTA section */}
      <div className="product-cta p-4 text-center m-2 rounded-md">
        <Link
          href="/request-feature"
          className="text-blue-600 font-medium hover:underline"
        >
          Request a Feature →
        </Link>
      </div>
    </div>
  )
}
