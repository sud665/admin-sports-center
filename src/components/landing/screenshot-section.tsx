"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ──────────────────────────── Hotspot data ──────────────────────────── */
interface Hotspot {
  id: string;
  label: string;
  top: string;
  left: string;
}

const hotspots: Hotspot[] = [
  { id: "stats", label: "한눈에 보는 운영 지표", top: "18%", left: "30%" },
  { id: "calendar", label: "실시간 예약 확인", top: "58%", left: "55%" },
  { id: "sidebar", label: "강사별 색상 구분", top: "45%", left: "8%" },
];

/* ──────────────────────────── Simple SVG icons ──────────────────────── */
function MoonIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SmartphoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  );
}

/* ──────────────────────────── Pulsing Hotspot ──────────────────────── */
function PulsingHotspot({ spot }: { spot: Hotspot }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="absolute z-20"
      style={{ top: spot.top, left: spot.left }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* pulse ring */}
      <span className="absolute inset-0 w-4 h-4 rounded-full bg-[#FDCA40]/40 animate-ping" />
      {/* solid dot */}
      <span className="relative block w-4 h-4 rounded-full bg-[#FDCA40] cursor-pointer" />

      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 whitespace-nowrap bg-[#080708] text-white text-xs px-3 py-1.5 rounded-lg shadow-lg border border-white/10"
          >
            {spot.label}
            {/* tooltip arrow */}
            <span className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#080708]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ──────────────────────────── Dashboard Mock ──────────────────────── */
function DashboardMock() {
  const stats = [
    { label: "오늘 예약", value: "24", sub: "+3 신규", border: "#3772FF" },
    { label: "이번 달 매출", value: "₩4.2M", sub: "▲ 12%", border: "#FDCA40" },
    { label: "미결제 건", value: "3", sub: "₩180,000", border: "#DF2935" },
    { label: "등록 회원", value: "312", sub: "+8 이번 주", border: "#3772FF" },
  ];

  const hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];
  const days = ["월", "화", "수", "목", "금", "토"];

  // Pre-defined calendar blocks — colored time slots
  const blocks: Record<string, { color: string; label: string }> = {
    "09-월": { color: "#3772FF", label: "김태권" },
    "09-수": { color: "#3772FF", label: "김태권" },
    "10-화": { color: "#FDCA40", label: "박유도" },
    "10-목": { color: "#FDCA40", label: "박유도" },
    "10-토": { color: "#FDCA40", label: "박유도" },
    "11-월": { color: "#DF2935", label: "이합기" },
    "11-수": { color: "#DF2935", label: "이합기" },
    "11-금": { color: "#DF2935", label: "이합기" },
    "13-화": { color: "#3772FF", label: "김태권" },
    "13-목": { color: "#3772FF", label: "김태권" },
    "14-월": { color: "#22c55e", label: "최검도" },
    "14-수": { color: "#22c55e", label: "최검도" },
    "14-금": { color: "#22c55e", label: "최검도" },
    "14-토": { color: "#22c55e", label: "최검도" },
    "15-화": { color: "#FDCA40", label: "박유도" },
    "15-목": { color: "#DF2935", label: "이합기" },
    "16-월": { color: "#3772FF", label: "김태권" },
    "16-수": { color: "#3772FF", label: "김태권" },
    "16-금": { color: "#FDCA40", label: "박유도" },
    "17-토": { color: "#DF2935", label: "이합기" },
  };

  return (
    <div className="space-y-4">
      {/* ── Stat cards row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-[#1a1a2e] rounded-lg p-3 border-t-2"
            style={{ borderColor: s.border }}
          >
            <p className="text-[#E6E8E6]/50 text-[10px] md:text-xs">{s.label}</p>
            <p className="text-white text-lg md:text-xl font-bold mt-1">{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: s.border }}>
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div className="bg-[#1a1a2e] rounded-lg p-3 md:p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-xs md:text-sm font-semibold">
            2026년 3월 · 주간 보기
          </p>
          <div className="flex gap-1">
            <span className="w-6 h-6 rounded bg-[#080708]/60 flex items-center justify-center text-white/40 text-xs">
              ‹
            </span>
            <span className="w-6 h-6 rounded bg-[#080708]/60 flex items-center justify-center text-white/40 text-xs">
              ›
            </span>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-[32px_repeat(6,1fr)] gap-px mb-1">
            <div />
            {days.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] text-[#E6E8E6]/40 py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Time rows */}
          {hours.map((h) => (
            <div
              key={h}
              className="grid grid-cols-[32px_repeat(6,1fr)] gap-px"
            >
              <div className="text-[10px] text-[#E6E8E6]/30 pr-1 text-right leading-6">
                {h}
              </div>
              {days.map((d) => {
                const block = blocks[`${h}-${d}`];
                return (
                  <div
                    key={`${h}-${d}`}
                    className="h-6 rounded-sm mx-px"
                    style={{
                      backgroundColor: block
                        ? `${block.color}33`
                        : "rgba(255,255,255,0.02)",
                      borderLeft: block
                        ? `2px solid ${block.color}`
                        : "2px solid transparent",
                    }}
                  >
                    {block && (
                      <span
                        className="text-[8px] md:text-[9px] pl-1 leading-6 truncate block"
                        style={{ color: block.color }}
                      >
                        {block.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex gap-3 mt-3 flex-wrap">
          {[
            { color: "#3772FF", name: "김태권" },
            { color: "#FDCA40", name: "박유도" },
            { color: "#DF2935", name: "이합기" },
            { color: "#22c55e", name: "최검도" },
          ].map((i) => (
            <div key={i.name} className="flex items-center gap-1">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: i.color }}
              />
              <span className="text-[10px] text-[#E6E8E6]/50">{i.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── Main Section ──────────────────────────── */
export default function ScreenshotSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 relative overflow-hidden bg-gradient-to-br from-[#080708] to-[#3772FF]"
    >
      {/* Title */}
      <h2 className="text-white text-3xl md:text-4xl font-bold text-center mb-16">
        실제 화면을 확인하세요
      </h2>

      {/* Mockup container */}
      <div className="max-w-4xl mx-auto px-4 relative">
        {/* Perspective wrapper */}
        <div style={{ perspective: "1200px" }}>
          <motion.div
            initial={{ opacity: 0, y: 80, rotateX: 15 }}
            animate={
              isInView
                ? { opacity: 1, y: 0, rotateX: 5 }
                : { opacity: 0, y: 80, rotateX: 15 }
            }
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="group"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div
              className="transition-transform duration-500 ease-out group-hover:[transform:rotateX(0deg)]"
              style={{ transform: "rotateX(5deg)", transformStyle: "preserve-3d" }}
            >
              {/* Browser chrome */}
              <div className="bg-[#1a1a2e] rounded-t-xl p-3 flex items-center gap-2">
                {/* Traffic lights */}
                <span className="w-3 h-3 rounded-full bg-[#DF2935]" />
                <span className="w-3 h-3 rounded-full bg-[#FDCA40]" />
                <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                {/* Address bar */}
                <div className="flex-1 bg-[#080708]/50 rounded-md h-7 ml-4 flex items-center px-3 text-[#E6E8E6]/40 text-xs">
                  centeron.app/dashboard
                </div>
              </div>

              {/* Browser content */}
              <div className="bg-[#0f0f23] rounded-b-xl p-4 md:p-6 relative">
                <DashboardMock />

                {/* Hotspots */}
                {hotspots.map((spot) => (
                  <PulsingHotspot key={spot.id} spot={spot} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Floating badges ── */}
        {/* Left badge */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute left-0 md:-left-4 top-1/3 -translate-x-1/2 hidden md:flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white text-sm items-center gap-2"
        >
          <MoonIcon />
          다크모드 지원
        </motion.div>

        {/* Right badge */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute right-0 md:-right-4 top-2/3 translate-x-1/2 hidden md:flex bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white text-sm items-center gap-2"
        >
          <SmartphoneIcon />
          모바일 반응형
        </motion.div>
      </div>
    </section>
  );
}
