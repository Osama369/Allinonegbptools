import { FaInstagram, FaFacebookF, FaTwitter, FaYoutube } from "react-icons/fa";
import logo from "../Assets/images/Logo.png";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-[#1f1f1f] text-white [font-family:'Poppins',sans-serif] py-12 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10 text-sm">
        {/* Logo & About */}
        <div className="col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10  rounded-full flex items-center justify-center">
              <img src={logo} className="w-14 h-14" />
              {/* Placeholder for Logo */}
            </div>
            <p className="text-white font-semibold leading-snug">
              GDP tools for Seo optimization
            </p>
          </div>
          <div className="flex space-x-4 mt-4 text-lg text-white/80">
            <FaInstagram className="hover:text-white" />
            <FaFacebookF className="hover:text-white" />
            <FaTwitter className="hover:text-white" />
            <FaYoutube className="hover:text-white" />
          </div>
        </div>

        {/* Links */}
        <div>
          <ul className="space-y-2">
            <li>
              <Link to="/blog" className="hover:underline">
                Blog
              </Link>
            </li>

            <li>
              <Link to="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <ul className="space-y-2">
            <li>
              <Link to="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:underline">
                Terms of Use
              </Link>
            </li>
            <li>
            
            </li>
          </ul>
        </div>

        {/* Email Sign-up */}
        <div>
          <p className="uppercase tracking-widest text-sm text-gray-400 mb-2">
            Sign up for emails
          </p>
          <p className="text-white mb-4">
            Get first dibs on new Tools and
            <br />
            advance notice on Services.
          </p>
          <form className="flex">
            <input
              type="email"
              placeholder="Email"
              className="px-4 py-2 w-full rounded-l bg-white text-black outline-none"
            />
            <button
              type="submit"
              className="bg-gradient-to-br from-cyan-400 to-blue-600 text-white px-4 py-2 rounded-r hover:bg-red-700"
            >
              Sign Me Up
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/60 text-center space-y-2">
        <div>
          © 2024 GDP tools{" "}
          <a href="#" className="underline">
            Privacy Policies
          </a>{" "}
          <a href="#" className="underline ml-2">
            Cookie Policies
          </a>
        </div>
        <div>All in One GBP Tools. All rights reserved</div>
      </div>
    </footer>
  );
}
