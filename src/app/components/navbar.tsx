"use client";

import Image from "next/image";
import { useState } from "react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="PiRisk Management"
              width={140}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>

          <ul className="hidden md:flex items-center gap-8">
            <li>
              <a
                href="#services"
                className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
              >
                Services
              </a>
            </li>
            <li>
              <a
                href="#about"
                className="text-sm font-medium text-gray-700 hover:text-teal-600 transition-colors"
              >
                About
              </a>
            </li>
            <li>
              <a
                href="/app"
                className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                PiTime
              </a>
            </li>
            <li>
              <a
                href="#contact"
                className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
              >
                Get In Touch
              </a>
            </li>
          </ul>

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="block h-0.5 w-6 bg-gray-700" />
            <span className="block h-0.5 w-6 bg-gray-700" />
            <span className="block h-0.5 w-6 bg-gray-700" />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-4">
            <div className="flex flex-col gap-4">
              <a href="#services" className="text-sm font-medium text-gray-700">
                Services
              </a>
              <a href="#about" className="text-sm font-medium text-gray-700">
                About
              </a>
              <a href="/app" className="text-sm font-medium text-teal-600">
                PiTime
              </a>
              <a
                href="#contact"
                className="inline-flex justify-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Get In Touch
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
