"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const reviews = [
  {
    name: "김지현 원장",
    type: "필라테스 스튜디오",
    color: "#FDCA40",
    badge: "정산 3시간 → 10분",
    text: "엑셀이랑 카톡으로 일정 관리하다 지쳐서 도입했는데, <strong>정산 시간이 3시간에서 10분으로 줄었어요.</strong> 이제 그 시간에 수업을 더 넣습니다.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    yOffset: 0,
  },
  {
    name: "박수진 원장",
    type: "요가 센터",
    color: "#3772FF",
    badge: "전화 문의 90% 감소",
    text: "강사들이 직접 자기 스케줄 확인하니까 <strong>전화 문의가 확 줄었어요.</strong> 저도 강사도 편해졌습니다. 진작 쓸 걸 그랬어요.",
    avatar:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    yOffset: -24,
  },
  {
    name: "이동훈 원장",
    type: "헬스 & PT",
    color: "#DF2935",
    badge: "회원 200명+ 관리",
    text: "회원 200명 넘어가니까 수기로 한계였는데, <strong>이제 회원 관리가 깔끔해졌어요.</strong> 담당 강사 배정도 한 번에 됩니다.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    yOffset: 12,
  },
];

function ReviewCard({
  review,
  index,
  isInView,
}: {
  review: (typeof reviews)[number];
  index: number;
  isInView: boolean;
}) {
  const yOffset = review.yOffset;

  return (
    <motion.div
      className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-shadow relative max-w-sm w-full"
      initial={{ opacity: 0, y: 60 }}
      animate={
        isInView
          ? { opacity: 1, y: yOffset }
          : { opacity: 0, y: 60 }
      }
      transition={{
        duration: 0.6,
        delay: index * 0.2,
        ease: "easeOut",
      }}
      whileHover={{ y: yOffset - 8 }}
      style={{ willChange: "transform" }}
    >
      {/* Quote mark */}
      <span
        className="absolute top-4 left-6 text-6xl font-serif leading-none select-none"
        style={{ color: review.color, opacity: 0.2 }}
      >
        &ldquo;
      </span>

      {/* Badge */}
      <div className="flex justify-end">
        <motion.span
          className="rounded-full px-3 py-1 text-xs font-bold text-white inline-block"
          style={{ backgroundColor: review.color }}
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 15,
            delay: index * 0.2 + 0.4,
          }}
        >
          {review.badge}
        </motion.span>
      </div>

      {/* Review text */}
      <p
        className="text-[#080708] text-base leading-relaxed mt-4"
        dangerouslySetInnerHTML={{ __html: review.text }}
      />

      {/* Author */}
      <div className="flex items-center gap-3 mt-6">
        <div
          className="w-12 h-12 rounded-full bg-cover bg-center shrink-0"
          style={{ backgroundImage: `url(${review.avatar})` }}
        />
        <div>
          <p className="text-[#080708] font-semibold text-sm">
            {review.name}
          </p>
          <p className="text-[#080708]/50 text-xs">{review.type}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReviewsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      id="reviews"
      className="py-24 md:py-32 bg-[#E6E8E6] relative"
    >
      <div className="max-w-6xl mx-auto px-6" ref={sectionRef}>
        {/* Header — left-aligned */}
        <div className="mb-16">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-[#080708] text-3xl md:text-5xl font-bold">
              센터온과 함께하는 원장님들
            </h2>
            <span className="text-[#FDCA40] text-2xl select-none">
              ★★★★★
            </span>
          </div>
          <p className="text-[#080708]/60 text-base mt-2">
            실제 사용 중인 원장님들의 이야기
          </p>
        </div>

        {/* Cards — asymmetric layout */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start justify-center">
          {reviews.map((review, i) => (
            <div
              key={review.name}
              className="flex justify-center w-full md:w-auto"
            >
              <ReviewCard review={review} index={i} isInView={isInView} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
