import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative bg-secondary-db-100 text-gray-300 px-6 md:px-16 pt-8 pb-5 rounded-t-3xl">
      <div className="mx-auto">
        {/* ROW 1: Logo (top) */}
        <div className="w-full">
          <Link href="/" className="block">
            <div className="relative w-28 h-9 md:w-36 md:h-11">
              <Image
                src="/icons/logo-white.svg"
                alt="WaySorted Logo"
                fill
                className="object-contain"
              />
            </div>
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-12 gap-20 items-start">
          <div className="col-span-12 lg:col-span-8 mt-21">
            <div className="grid grid-cols-4 gap-2">
              <div>
                <h3 className="font-semibold text-base mb-4 text-white">
                  Category
                </h3>
                <ul className="space-y-2 text-secondary-db-40 font-regular text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Color
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Image
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Text
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      AI Tools
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-white text-base">
                  Tools
                </h3>
                <ul className="space-y-2 text-secondary-db-40 font-regular text-sm">
                  <li>
                    <a href="#" className="hover:text-white">
                      Tool name 01
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Tool name 02
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Tool name 03
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Tool name 04
                    </a>
                  </li>
                </ul>
              </div>

              <div className="col-span-2">
                <h3 className="font-semibold mb-4 text-white text-base">
                  Palattable brief
                </h3>
                <div className="bg-transparent border border-gray-700 rounded-xl p-6 min-h-[140px] outline outline-1 outline-white/10 button-shadow flex flex-col justify-between">
                  <p className="text-secondary-db-30 font-regular text-sm mb-4">
                    Lorem ipsum dolor sit amet, consectetur a Lorem ipsum dolor
                    sit amet, consectetur adipiscing elit. Aenean eleifend
                    condimentum risus.
                  </p>

                  <div className="pt-2">
                    <button className="inline-flex items-center gap-3 bg-secondary-db-100 outline outline-1 outline-secondary-db-90 px-5 py-4 cursor-pointer rounded-full hover:bg-secondary-db-90 transition">
                      <span className="text-sm font-medium text-white">
                        Visit Plugin
                      </span>
                      <Image
                        src="/icons/arrow-white.svg"
                        alt="Arrow Right"
                        width={12}
                        height={12}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 self-start">
            <div className="bg-secondary-db-90 rounded-xl p-4 h-78 flex flex-col justify-between">
              <div>
                <div className="bg-secondary-db-80 w-full h-50 rounded-md mb-3">
                  images
                </div>
                <h4 className="text-white font-medium text-xl">
                  Release Notes !
                </h4>
                <p className="text-gray-400 text-sm text-regular mb-3">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </p>
              </div>

              <div className="flex gap-2 justify-center items-center">
                <span className="w-3 h-1 bg-gray-200 rounded-full"></span>
                <span className="w-2 h-1 bg-white0 rounded-full"></span>
                <span className="w-2 h-1 bg-white0 rounded-full"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider and bottom sections unchanged */}
        <div className="dashed-line-white my-6"></div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-gray-400">
            <div className="w-8 h-8 rounded-md outline outline-1 outline-secondary-db-80 flex items-center justify-center cursor-pointer">
              <Image
                src="/icons/insta.svg"
                alt="Instagram"
                width={16}
                height={16}
              />
            </div>
            <div className="w-8 h-8 rounded-md outline outline-1 outline-secondary-db-80 flex items-center justify-center cursor-pointer">
              <Image
                src="/icons/linkedin.svg"
                alt="LinkedIn"
                width={16}
                height={16}
              />
            </div>
            <div className="w-8 h-8 rounded-md outline outline-1 outline-secondary-db-80 flex items-center justify-center cursor-pointer">
              <Image
                src="/icons/discord.svg"
                alt="Discord"
                width={16}
                height={16}
              />
            </div>
            <div className="w-8 h-8 rounded-md outline outline-1 outline-secondary-db-80 flex items-center justify-center cursor-pointer">
              <Image src="/icons/x.svg" alt="X" width={16} height={16} />
            </div>
          </div>

          <p className="text-sm leading-relaxed font-medium text-secondary-db-40 max-w-xs">
            Lorem ipsum dolor sit amet, consectetur a Lorem ipsum dolor sit
            amet, consectetur adipiscing elit.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8 items-start">
          <div className="col-span-1 lg:col-span-5 pt-9">
            <h4 className="font-semibold text-secondary-db-40 mb-3">
              Get exclusive updates !
            </h4>
            <div className="flex items-center bg-white rounded-xl overflow-hidden w-full max-w-sm">
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-4 py-2 text-secondary-db-60 focus:outline-none"
              />
              <button
                className="flex items-center justify-center -ml-10 rounded-lg cursor-pointer w-7 h-7 hover:bg-secondary-db-5 hover:bg-secondary-db-10 transition-colors"
                title="Send"
              >
                <Image
                  src="/icons/arrow-black.svg"
                  alt="Send"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </button>
            </div>

            <p className="text-xs text-secondary-db-60 mt-2 max-w-xs">
              Be the first to know about our updates. Unsubscribe anytime.
            </p>
          </div>

          <div className="col-span-1 lg:col-span-5 lg:col-start-8">
            <div className="grid grid-cols-3 gap-12 text-sm">
              <div>
                <h5 className="font-semibold mb-3 text-white">Get Started</h5>
                <ul className="space-y-2 text-secondary-db-40">
                  <li>
                    <a href="#" className="hover:text-white">
                      Pricing
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Enterprise
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Help Centre
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold mb-3 text-white">Company</h5>
                <ul className="space-y-2 text-secondary-db-40">
                  <li>
                    <a href="#" className="hover:text-white">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Learning
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Docs
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Careers
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Events
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h5 className="font-semibold mb-3 text-white">Support</h5>
                <ul className="space-y-2 text-secondary-db-40">
                  <li>
                    <a href="#" className="hover:text-white">
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Request a feature
                    </a>
                  </li>
                  <li>
                    <a href="#" className="hover:text-white">
                      Security
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-3 flex flex-col md:flex-row justify-between items-center text-secondary-db-50 text-sm">
          <span>© 2025 Waysorted</span>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
