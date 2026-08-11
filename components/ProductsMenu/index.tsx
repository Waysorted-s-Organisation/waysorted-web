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
      className={`products-menu absolute top-full w-[780px] 
        bg-white menu-shadow rounded-xl overflow-hidden ${className}
        transition-opacity duration-150
        ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
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
              title={product.name}
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

      <div className="px-4 pb-4">
        <Link
          href="/requests"
          className="w-full mt-1 inline-flex items-center justify-between rounded-lg bg-primary-way-100 text-white px-4 py-3 text-sm font-semibold active:scale-[0.99] shadow-card"
        >
          <span>Request a feature</span>
          <span aria-hidden className="text-lg leading-none">→</span>
        </Link>
      </div>

    </div>
  );
};
