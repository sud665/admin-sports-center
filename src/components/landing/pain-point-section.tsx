"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const cards = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <line x1="9" y1="12" x2="15" y2="12" />
        <line x1="9" y1="16" x2="13" y2="16" />
      </svg>
    ),
    title: "엑셀로 일정 관리, 아직도?",
    desc: "강사별 스케줄 겹침, 수기 입력 실수, 카톡으로 일일이 확인하는 하루하루...",
    rotate: -2,
    translateY: "translate-y-0",
    initial: { opacity: 0, x: -100, rotate: -10 },
    animate: { opacity: 1, x: 0, rotate: -2 },
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="6" />
        <circle cx="15" cy="12" r="6" />
        <path d="M12 6a6 6 0 0 1 0 12" />
      </svg>
    ),
    title: "정산할 때마다 야근",
    desc: "강사별 수업 횟수 세고, 계산기 두드리고, 틀리면 처음부터 다시...",
    rotate: 1,
    translateY: "translate-y-[-20px]",
    initial: { opacity: 0, x: 100, rotate: 10 },
    animate: { opacity: 1, x: 0, rotate: 1 },
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 15s1.5-2 4-2 4 2 4 2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    title: "회원이 늘수록 혼란도 늘고",
    desc: "담당 강사 변경, 연락처 찾기, 메모는 또 어디갔지...",
    rotate: -1,
    translateY: "translate-y-[10px]",
    initial: { opacity: 0, x: -100, rotate: -10 },
    animate: { opacity: 1, x: 0, rotate: -1 },
  },
];

export default function PainPointSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const bottomInView = useInView(bottomRef, { once: true, amount: 0.3 });

  return (
    <section className="py-24 md:py-32 bg-[#080708] relative overflow-hidden">
      {/* Decorative red diagonal stripes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(223,41,53,0.05) 40px, rgba(223,41,53,0.05) 80px)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6" ref={sectionRef}>
        {/* Cards — scattered desk layout */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={i}
              className={`bg-[#080708] border border-[#E6E8E6]/10 rounded-2xl p-8 max-w-sm w-full ${card.translateY}`}
              initial={card.initial}
              animate={isInView ? card.animate : card.initial}
              transition={{
                duration: 0.7,
                delay: i * 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ rotate: 0, scale: 1.05, transition: { type: "spring", stiffness: 300, damping: 20 } }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#DF2935]/10 flex items-center justify-center mb-4">
                {card.icon}
              </div>
              <h3 className="text-white text-xl font-bold mb-3">{card.title}</h3>
              <p className="text-[#E6E8E6]/60 text-sm leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Bottom transition text */}
        <div ref={bottomRef}>
          <motion.p
            className="text-[#FDCA40] text-2xl md:text-3xl font-bold text-center mt-20"
            initial={{ opacity: 0, y: 20 }}
            animate={bottomInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            이제 다른 방법이 있습니다
          </motion.p>
        </div>
      </div>

      {/* Wave divider at bottom */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
        <svg
          className="relative block w-full h-16 md:h-24"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,60 C200,120 400,0 600,60 C800,120 1000,0 1200,60 L1200,120 L0,120 Z"
            fill="#E6E8E6"
          />
        </svg>
      </div>
    </section>
  );
}
