import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#0E1114] text-gray-300 px-6 md:px-16 py-12 rounded-t-3xl">
      {/* Top Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-12">

        {/* Left Section */}
        <div className="flex flex-col gap-6 max-w-sm">
          <Image src="/logo-white.svg" alt="Waysorted" width={160} height={40} />

          <div className="grid grid-cols-2 gap-8 mt-6">
            {/* Category */}
            <div>
              <h3 className="font-semibold mb-4">Category</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Color</a></li>
                <li><a href="#" className="hover:text-white">Image</a></li>
                <li><a href="#" className="hover:text-white">Text</a></li>
                <li><a href="#" className="hover:text-white">AI Tools</a></li>
              </ul>
            </div>

            {/* Tools */}
            <div>
              <h3 className="font-semibold mb-4">Tools</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white">Tool name 01</a></li>
                <li><a href="#" className="hover:text-white">Tool name 01</a></li>
                <li><a href="#" className="hover:text-white">Tool name 01</a></li>
                <li><a href="#" className="hover:text-white">Tool name 01</a></li>
              </ul>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex gap-4 mt-6">
            {/* <FaInstagram className="w-6 h-6 cursor-pointer hover:text-white" />
            <FaLinkedin className="w-6 h-6 cursor-pointer hover:text-white" />
            <FaDiscord className="w-6 h-6 cursor-pointer hover:text-white" />
            <FaTimes className="w-6 h-6 cursor-pointer hover:text-white" /> */}
          </div>

          <p className="text-sm leading-relaxed mt-4 text-gray-400">
            Our intuitive UI is designed to be minimal and unobtrusive,
            ensuring your creative canvas remains clutter-free. Design smarter, not harder.
          </p>
        </div>

        {/* Middle Section */}
        <div className="max-w-md">
          <h3 className="font-semibold mb-4">Palattable brief</h3>
          <div className="bg-transparent border border-gray-700 rounded-xl p-4 mb-6">
            <p className="text-gray-400 text-sm mb-4">
              Lorem ipsum dolor sit amet, consectetur a Lorem ipsum dolor sit amet,
              consectetur adipiscing elit. Aenean eleifend condimentum risus.
            </p>
            <button className="flex items-center gap-2 bg-[#1E2227] px-5 py-2 rounded-full hover:bg-[#272C33]">
              Visit Plugin <span className="text-lg">↗</span>
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="max-w-sm">
          <div className="bg-[#1B1F24] rounded-xl p-4">
            <div className="bg-[#2B2F34] w-full h-40 rounded-md mb-4"></div>
            <h4 className="text-white font-semibold">Release Notes !</h4>
            <p className="text-gray-400 text-sm mb-4">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <div className="flex gap-2 justify-center items-center">
              <span className="w-4 h-1 bg-gray-200 rounded-full"></span>
              <span className="w-4 h-1 bg-gray-500 rounded-full"></span>
              <span className="w-4 h-1 bg-gray-500 rounded-full"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-700 my-8"></div>

      {/* Bottom Section */}
      <div className="flex flex-col lg:flex-row justify-between gap-8">
        {/* Email Subscription */}
        <div className="flex flex-col gap-2 max-w-md">
          <h4 className="font-semibold text-white">Get exclusive updates !</h4>
          <div className="flex items-center bg-white rounded-xl overflow-hidden w-80">
            <input
              type="email"
              placeholder="Your email"
              className="w-full px-4 py-3 text-black focus:outline-none"
            />
            <button className="bg-transparent px-4 text-xl text-gray-700">↗</button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Be the first to know about our updates. Unsubscribe anytime.
          </p>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-3 gap-12 text-sm">
          <div>
            <h5 className="font-semibold mb-3">Get Started</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Pricing</a></li>
              <li><a href="#" className="hover:text-white">Enterprise</a></li>
              <li><a href="#" className="hover:text-white">FAQ</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Help Centre</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-3">Company</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">About Us</a></li>
              <li><a href="#" className="hover:text-white">Learning</a></li>
              <li><a href="#" className="hover:text-white">Docs</a></li>
              <li><a href="#" className="hover:text-white">Careers</a></li>
              <li><a href="#" className="hover:text-white">Events</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold mb-3">Support</h5>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white">Contact Us</a></li>
              <li><a href="#" className="hover:text-white">Request a feature</a></li>
              <li><a href="#" className="hover:text-white">Security</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between text-gray-500 text-sm">
        <span>© 2025 Waysorted</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">Privacy Policy</a>
          <a href="#" className="hover:text-white">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
