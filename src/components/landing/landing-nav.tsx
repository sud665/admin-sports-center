"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CenterOnLogo } from "./centeron-logo";

const NAV_LINKS = [
  { label: "기능", href: "#features" },
  { label: "리뷰", href: "#reviews" },
  { label: "시작하기", href: "#cta" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const id = href.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      setMobileOpen(false);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 w-full z-50 transition-colors duration-300 ${
          scrolled ? "bg-[#080708]/80 backdrop-blur-md" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Left: Logo */}
          <Link href="/" aria-label="CenterOn 홈">
            <CenterOnLogo size="md" />
          </Link>

          {/* Right: Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-[#E6E8E6] hover:text-[#FDCA40] transition"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              className="border border-[#3772FF] text-[#3772FF] hover:bg-[#3772FF] hover:text-white rounded-full px-4 py-2 transition"
            >
              로그인
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "메뉴 닫기" : "메뉴 열기"}
          >
            <span
              className={`block w-6 h-0.5 bg-[#E6E8E6] transition-transform duration-300 ${
                mobileOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#E6E8E6] transition-opacity duration-300 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-[#E6E8E6] transition-transform duration-300 ${
                mobileOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </motion.nav>

      {/* Mobile overlay menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#080708] flex flex-col items-center justify-center gap-10 md:hidden"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-3xl text-[#E6E8E6] hover:text-[#FDCA40] transition"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="border border-[#3772FF] text-[#3772FF] hover:bg-[#3772FF] hover:text-white rounded-full px-8 py-3 text-xl transition"
            >
              로그인
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
