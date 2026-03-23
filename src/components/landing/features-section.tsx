"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { CalendarDays, Calculator, Users, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  color: string;
  number: string;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: CalendarDays,
    color: "#3772FF",
    number: "01",
    title: "한눈에 보는 캘린더",
    desc: "강사별 색상으로 구분된 수업 일정을 드래그 한 번으로 예약하고 변경하세요.",
  },
  {
    icon: Calculator,
    color: "#FDCA40",
    number: "02",
    title: "자동 급여 정산",
    desc: "수업 횟수 × 단가, 월별 자동 계산. 정산 실수 제로, 야근도 제로.",
  },
  {
    icon: Users,
    color: "#DF2935",
    number: "03",
    title: "회원 · 강사 통합 관리",
    desc: "담당 강사 지정, 연락처, 메모를 한 곳에서. 회원이 늘어도 혼란은 없습니다.",
  },
  {
    icon: Smartphone,
    color: "#3772FF",
    number: "04",
    title: "강사도 직접 확인",
    desc: "내 스케줄, 내 정산 내역을 강사 계정으로 바로 조회. 전화 문의 끝.",
  },
];

/* ───── Mock UI cards ───── */

function CalendarMock({ color }: { color: string }) {
  const days = ["월", "화", "수", "목", "금"];
  const slots = [
    [1, 0, 1, 0, 1],
    [0, 1, 0, 1, 0],
    [1, 1, 0, 0, 1],
    [0, 0, 1, 1, 0],
    [1, 0, 0, 1, 1],
  ];
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex gap-2">
        {days.map((d) => (
          <div
            key={d}
            className="flex-1 text-center text-xs font-semibold text-[#080708]/50"
          >
            {d}
          </div>
        ))}
      </div>
      {/* Time slots */}
      {slots.map((row, ri) => (
        <div key={ri} className="flex gap-2">
          {row.map((filled, ci) => (
            <div
              key={ci}
              className="flex-1 h-7 rounded-md"
              style={{
                backgroundColor: filled
                  ? `${color}${ri % 2 === 0 ? "40" : "20"}`
                  : "#f3f4f6",
                borderLeft: filled ? `3px solid ${color}` : "none",
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function SettlementMock({ color }: { color: string }) {
  const rows = [
    { w1: "60%", w2: "40%", amount: "₩1,200,000" },
    { w1: "75%", w2: "55%", amount: "₩980,000" },
    { w1: "50%", w2: "65%", amount: "₩1,450,000" },
    { w1: "65%", w2: "35%", amount: "₩760,000" },
  ];
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between text-xs font-semibold text-[#080708]/40 border-b border-[#080708]/10 pb-2">
        <span>강사명</span>
        <span>수업 수</span>
        <span>정산액</span>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="h-3 rounded-full"
            style={{ width: r.w1, backgroundColor: `${color}30` }}
          />
          <div
            className="h-3 rounded-full"
            style={{ width: r.w2, backgroundColor: `${color}18` }}
          />
          <span
            className="ml-auto text-xs font-bold whitespace-nowrap"
            style={{ color }}
          >
            {r.amount}
          </span>
        </div>
      ))}
      {/* Total bar */}
      <div
        className="mt-2 h-10 rounded-lg flex items-center justify-between px-4"
        style={{ backgroundColor: `${color}15` }}
      >
        <span className="text-xs font-semibold text-[#080708]/50">합계</span>
        <span className="text-sm font-black" style={{ color }}>
          ₩4,390,000
        </span>
      </div>
    </div>
  );
}

function MembersMock({ color }: { color: string }) {
  const members = [
    { name: "김OO", initials: "김" },
    { name: "이OO", initials: "이" },
    { name: "박OO", initials: "박" },
    { name: "최OO", initials: "최" },
  ];
  return (
    <div className="space-y-3">
      {members.map((m, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{
              backgroundColor:
                i % 2 === 0 ? color : `${color}${i === 1 ? "90" : "60"}`,
            }}
          >
            {m.initials}
          </div>
          <div className="flex-1 space-y-1.5">
            <div
              className="h-3 rounded-full"
              style={{
                width: `${55 + i * 10}%`,
                backgroundColor: `${color}25`,
              }}
            />
            <div
              className="h-2 rounded-full"
              style={{
                width: `${40 + i * 8}%`,
                backgroundColor: `${color}12`,
              }}
            />
          </div>
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        </div>
      ))}
    </div>
  );
}

function MobileMock({ color }: { color: string }) {
  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-44 h-72 rounded-[1.5rem] border-4 border-[#080708]/10 bg-[#fafafa] p-3 relative overflow-hidden">
        {/* Notch */}
        <div className="w-16 h-4 bg-[#080708]/10 rounded-full mx-auto mb-3" />
        {/* Screen content */}
        <div className="space-y-2.5">
          {/* Status bar mock */}
          <div className="flex justify-between">
            <div
              className="h-2 w-10 rounded-full"
              style={{ backgroundColor: `${color}30` }}
            />
            <div
              className="h-2 w-6 rounded-full"
              style={{ backgroundColor: `${color}20` }}
            />
          </div>
          {/* Title */}
          <div
            className="h-4 w-24 rounded-md"
            style={{ backgroundColor: `${color}25` }}
          />
          {/* Schedule items */}
          {[70, 50, 85, 60].map((w, i) => (
            <div
              key={i}
              className="h-8 rounded-lg flex items-center px-2 gap-2"
              style={{ backgroundColor: `${color}${i % 2 === 0 ? "12" : "08"}` }}
            >
              <div
                className="w-1.5 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div
                className="h-2 rounded-full"
                style={{ width: `${w}%`, backgroundColor: `${color}30` }}
              />
            </div>
          ))}
          {/* Bottom nav */}
          <div className="flex justify-around pt-2 border-t border-[#080708]/5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="w-5 h-5 rounded-full"
                style={{
                  backgroundColor:
                    n === 1 ? color : `${color}20`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const mockComponents = [CalendarMock, SettlementMock, MembersMock, MobileMock];

/* ───── Feature Block ───── */

function FeatureBlock({ feature, index }: { feature: Feature; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const isOdd = index % 2 === 0; // 0-indexed: 0,2 = odd items (1st,3rd)
  const Icon = feature.icon;
  const MockUI = mockComponents[index];

  return (
    <div ref={ref} className="relative py-16 md:py-24">
      {/* Background number */}
      <motion.span
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8rem] md:text-[12rem] font-black text-[#080708]/[0.03] select-none pointer-events-none"
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {feature.number}
      </motion.span>

      <div
        className={`flex flex-col gap-10 md:gap-16 items-center ${
          isOdd ? "md:flex-row" : "md:flex-row-reverse"
        }`}
      >
        {/* Text side — 40% */}
        <motion.div
          className="w-full md:w-[40%] relative z-10"
          initial={{ opacity: 0, x: isOdd ? -60 : 60 }}
          animate={
            isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: isOdd ? -60 : 60 }
          }
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Icon circle */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: `${feature.color}1A` }}
          >
            <Icon size={28} color={feature.color} />
          </div>

          {/* Title with color bar */}
          <div className="flex items-center gap-3 text-[#080708] text-2xl md:text-3xl font-bold">
            <div
              className="w-1 h-12 rounded-full shrink-0"
              style={{ backgroundColor: feature.color }}
            />
            {feature.title}
          </div>

          {/* Description */}
          <p className="text-[#080708]/70 text-base md:text-lg mt-4 max-w-md leading-relaxed">
            {feature.desc}
          </p>
        </motion.div>

        {/* Visual side — 60% */}
        <motion.div
          className="w-full md:w-[60%] relative z-10"
          initial={{ opacity: 0, y: 60, rotate: 0 }}
          animate={
            isInView
              ? { opacity: 1, y: 0, rotate: isOdd ? 2 : -2 }
              : { opacity: 0, y: 60, rotate: 0 }
          }
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <MockUI color={feature.color} />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ───── Features Section ───── */

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="py-24 md:py-32 bg-[#E6E8E6] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Section title — left aligned */}
        <h2 className="text-[#080708] text-3xl md:text-5xl font-bold mb-8">
          센터온이 해결합니다
        </h2>

        {/* Feature blocks */}
        {features.map((feature, i) => (
          <FeatureBlock key={feature.number} feature={feature} index={i} />
        ))}
      </div>
    </section>
  );
}
