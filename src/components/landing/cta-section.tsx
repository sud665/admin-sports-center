"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const checklistItems = [
  "신용카드 불필요",
  "30일 전 기능 무료",
  "1분이면 시작",
];

const CONFETTI_COLORS = ["#3772FF", "#DF2935", "#FDCA40"];

// Deterministic pseudo-random values for confetti pieces (avoids impure Math.random during render)
const CONFETTI_PIECES = Array.from({ length: 14 }, (_, i) => {
  // Simple hash-based deterministic values per index
  const h1 = ((i * 2654435761) >>> 0) / 4294967296;
  const h2 = ((i * 2246822519 + 1) >>> 0) / 4294967296;
  const h3 = ((i * 3266489917 + 2) >>> 0) / 4294967296;
  const h4 = ((i * 668265263 + 3) >>> 0) / 4294967296;
  const h5 = ((i * 374761393 + 4) >>> 0) / 4294967296;
  return {
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    x: (h1 - 0.5) * 300,
    y: (h2 - 0.5) * 300,
    rotate: h3 * 720 - 360,
    size: h4 * 8 + 4,
    isCircle: h5 > 0.5,
  };
});

function Confetti() {
  const pieces = CONFETTI_PIECES;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? "50%" : "2px",
          }}
          initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0 }}
          animate={{
            opacity: [1, 1, 0],
            x: p.x,
            y: p.y,
            rotate: p.rotate,
            scale: [0, 1.2, 1],
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function CtaSection() {
  const [formData, setFormData] = useState({
    centerName: "",
    name: "",
    email: "",
    phone: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const inputClass =
    "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-[#3772FF] transition";

  return (
    <section
      id="cta"
      ref={sectionRef}
      className="py-24 md:py-32 bg-[#080708] relative overflow-hidden"
    >
      {/* Decorative gradient blobs */}
      <motion.div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#3772FF]/20 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#DF2935]/20 blur-3xl"
        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-12 md:gap-16 items-center">
        {/* Left column — text */}
        <motion.div
          className="md:w-3/5"
          initial={{ opacity: 0, x: -60 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -60 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <p className="text-[#FDCA40] text-sm md:text-base tracking-widest uppercase font-semibold">
            30일 무료, 부담 없이
          </p>
          <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mt-4">
            지금 센터를
            <br />
            켜보세요.
          </h2>

          <ul className="mt-8 space-y-3">
            {checklistItems.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="text-[#3772FF] text-lg">✓</span>
                <span className="text-[#E6E8E6] text-base">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right column — form */}
        <motion.div
          className="md:w-2/5 w-full"
          initial={{ opacity: 0, x: 60 }}
          animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 60 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        >
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 relative">
            <AnimatePresence mode="wait">
              {!submitted ? (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <h3 className="text-white text-xl font-bold mb-6">
                    무료 체험 신청
                  </h3>

                  <div className="space-y-4">
                    <input
                      type="text"
                      name="centerName"
                      placeholder="센터명"
                      value={formData.centerName}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <input
                      type="text"
                      name="name"
                      placeholder="이름"
                      value={formData.name}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="이메일"
                      value={formData.email}
                      onChange={handleChange}
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      name="phone"
                      placeholder="전화번호"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full bg-[#FDCA40] text-[#080708] font-bold py-4 rounded-xl text-lg mt-6 hover:shadow-[0_0_30px_rgba(253,202,64,0.4)] transition cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    무료로 시작하기
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="success"
                  className="flex flex-col items-center justify-center py-8 relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <Confetti />

                  {/* Checkmark circle */}
                  <motion.svg
                    width="72"
                    height="72"
                    viewBox="0 0 72 72"
                    fill="none"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 12,
                      delay: 0.2,
                    }}
                  >
                    <circle cx="36" cy="36" r="36" fill="#22C55E" />
                    <motion.path
                      d="M22 36L32 46L50 28"
                      stroke="white"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                    />
                  </motion.svg>

                  <p className="text-white text-2xl font-bold mt-6">
                    신청이 완료되었습니다!
                  </p>
                  <p className="text-[#E6E8E6]/60 mt-2">
                    빠른 시일 내에 연락드리겠습니다.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
