"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const bgImages = [
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1920&q=80",
  "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1920&q=80",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1920&q=80",
];

const kenburnsStyle = `
@keyframes kenburns {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}
`;

export default function HeroSection() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleScrollToCta = () => {
    const el = document.getElementById("cta");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const staggerItem = (index: number) => ({
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.2 * index, duration: 0.8, ease: "easeOut" as const },
  });

  return (
    <section className="relative min-h-screen overflow-hidden">
      <style>{kenburnsStyle}</style>

      {/* Background image slideshow */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentImage}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${bgImages[currentImage]})`,
              animation: "kenburns 15s ease-in-out forwards",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Text content — LEFT-BOTTOM asymmetric */}
      <div className="absolute bottom-[15%] left-[5%] md:left-[8%] max-w-2xl">
        <motion.p
          {...staggerItem(0)}
          className="text-[#FDCA40] text-sm md:text-base tracking-widest uppercase"
        >
          필라테스 · 요가 · 헬스 센터 통합 관리
        </motion.p>

        <motion.h1
          {...staggerItem(1)}
          className="text-white text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mt-4"
        >
          센터 운영,
          <br />
          이제 <span className="text-[#3772FF]">켜기</span>만 하세요.
        </motion.h1>

        <motion.p
          {...staggerItem(2)}
          className="text-[#E6E8E6] text-base md:text-lg mt-4"
        >
          강사 일정, 회원 관리, 급여 정산까지 하나로
        </motion.p>

        <motion.div {...staggerItem(3)} className="mt-8">
          <motion.button
            onClick={handleScrollToCta}
            className="bg-[#3772FF] text-white text-lg px-8 py-4 rounded-full font-semibold cursor-pointer"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 10px 25px rgba(55, 114, 255, 0.3)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            30일 무료 체험
          </motion.button>
          <p className="text-[#E6E8E6]/60 text-sm mt-3">
            신용카드 없이 바로 시작
          </p>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <motion.div
          className="animate-bounce"
          {...staggerItem(4)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </motion.div>
      </div>
    </section>
  );
}
