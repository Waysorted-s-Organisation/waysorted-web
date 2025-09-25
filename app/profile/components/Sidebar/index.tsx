"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
export default function Sidebar() {
  const router = useRouter();
  return (
    <aside className="sticky top-0 hidden h-[calc(100vh-48px)] w-64 shrink-0 border-r border-secondary-db-5 bg-white px-4 pb-6 pt-4 lg:block">
      <div className="mb-2 flex flex-col gap-2 border-b border-secondary-db-5 pb-4">
        <Link href="/">
            <Image
                src="/icons/waycon.svg"
                alt="Waysorted Logo"
                width={32}
                height={32}
                className="object-contain inline-block mr-2"
            />
            <div className="text-base font-semibold text-secondary-db-100 inline-block">Waysorted</div>
        </Link>
        
      </div>

      <nav>
        <button 
        onClick={()=> router.push('/')}
        title="Back to home"
        aria-label="Back to home"
        className="inline-flex items-center gap-1 text-sm text-secondary-db-70 rounded-md border border-secondary-db-5 mb-6 px-17 py-1 cursor-pointer hover:bg-secondary-db-5 hover:text-secondary-db-100 transition-all duration-200">
          <span className="text-lg">‹</span> Back home
        </button>

        <div className="px-2">
            <h2 className="mb-4 text-base font-medium text-secondary-db-100">
                Settings
            </h2>
            <div className="px-2 text-sm text-secondary-db-90 font-semibold">
                <ul className="space-y-3">
                <li className="h-7 w-45 px-2 py-1 rounded-lg hover:bg-primary-way-5 cursor-pointer">General</li>
                <li className="h-7 w-45 px-2 py-1 rounded-lg hover:bg-primary-way-5 cursor-pointer">Credits Usage</li>
                <li className="h-7 w-45 px-2 py-1 rounded-lg hover:bg-primary-way-5 cursor-pointer">Subscription</li>
                <li className="h-7 w-45 px-2 py-1 rounded-lg hover:bg-primary-way-5 cursor-pointer">Notifications</li>
                <li className="h-7 w-45 px-2 py-1 rounded-lg hover:bg-primary-way-5 cursor-pointer">Integrations</li>
                <li className="h-7 w-45 px-2 py-1 rounded-lg hover:bg-primary-way-5 cursor-pointer">Beta Features</li>
                </ul>
            </div>
        </div>
      </nav>
    </aside>
  );
}