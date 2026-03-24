"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/use-auth";
import { useMemberships, type Membership } from "@/lib/hooks/use-memberships";
import { ArrowLeft, Sparkles, Star, Phone, X, Ticket, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface Plan {
  id: string;
  name: string;
  type: "count" | "period";
  price: number;
  perSession?: number;
  totalCount?: number;
  periodMonths?: number;
  badge?: { label: string; color: string; bg: string };
}

const PLANS: Plan[] = [
  {
    id: "count-10",
    name: "10회 수강권",
    type: "count",
    price: 500000,
    perSession: 50000,
    totalCount: 10,
  },
  {
    id: "count-30",
    name: "30회 수강권",
    type: "count",
    price: 1200000,
    perSession: 40000,
    totalCount: 30,
    badge: { label: "인기", color: "text-[#B8860B]", bg: "bg-[#FDCA40]" },
  },
  {
    id: "count-50",
    name: "50회 수강권",
    type: "count",
    price: 1750000,
    perSession: 35000,
    totalCount: 50,
    badge: { label: "최저가", color: "text-white", bg: "bg-[#DF2935]" },
  },
  {
    id: "period-1",
    name: "1개월 무제한",
    type: "period",
    price: 300000,
    periodMonths: 1,
  },
  {
    id: "period-3",
    name: "3개월 무제한",
    type: "period",
    price: 800000,
    periodMonths: 3,
    badge: { label: "인기", color: "text-[#B8860B]", bg: "bg-[#FDCA40]" },
  },
  {
    id: "period-6",
    name: "6개월 무제한",
    type: "period",
    price: 1400000,
    periodMonths: 6,
    badge: { label: "최저가", color: "text-white", bg: "bg-[#DF2935]" },
  },
];

function formatPrice(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n);
}

function ActiveMembershipBanner({ m }: { m: Membership }) {
  const isCount = m.type === "count";
  const endDate = new Date(m.endDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-br from-[#3772FF] to-[#3772FF]/80 rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/60 font-medium">현재 이용중</p>
          <p className="text-lg font-bold mt-1">{m.name}</p>
        </div>
        <Ticket className="w-6 h-6 text-white/40" />
      </div>
      <div className="flex items-baseline gap-3 mt-4">
        {isCount ? (
          <>
            <span className="text-3xl font-bold">{m.remainingCount}</span>
            <span className="text-sm text-white/60">/ {m.totalCount}회 남음</span>
          </>
        ) : (
          <>
            <span className="text-3xl font-bold">D-{daysLeft > 0 ? daysLeft : 0}</span>
            <span className="text-sm text-white/60">남음</span>
          </>
        )}
      </div>
      <p className="text-xs text-white/40 mt-2">
        {m.startDate} ~ {m.endDate}
      </p>
    </div>
  );
}

export default function MembershipPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: allMemberships, isLoading: memberLoading } = useMemberships("active");
  const [purchaseDialog, setPurchaseDialog] = useState(false);

  const myActive = allMemberships?.filter(
    (m) => m.memberId === user?.memberId && m.status === "active"
  ) ?? [];

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-[#3772FF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-5 pt-14 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/m/profile"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#080708]" />
        </Link>
        <h1 className="text-xl font-bold text-[#080708]">수강권 구매</h1>
      </div>

      {/* Current membership */}
      {!memberLoading && myActive.length > 0 && (
        <div className="mb-6 space-y-3">
          {myActive.map((m) => (
            <ActiveMembershipBanner key={m.id} m={m} />
          ))}
        </div>
      )}

      {/* Section: Count-based */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 px-1">
          횟수 수강권
        </h2>
        <div className="space-y-3">
          {PLANS.filter((p) => p.type === "count").map((plan) => (
            <PlanCard key={plan.id} plan={plan} onPurchase={() => setPurchaseDialog(true)} />
          ))}
        </div>
      </div>

      {/* Section: Period-based */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-3 px-1">
          기간 무제한 수강권
        </h2>
        <div className="space-y-3">
          {PLANS.filter((p) => p.type === "period").map((plan) => (
            <PlanCard key={plan.id} plan={plan} onPurchase={() => setPurchaseDialog(true)} />
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
        <Phone className="w-3.5 h-3.5" />
        <span>결제 관련 문의: 02-1234-5678</span>
      </div>

      {/* Purchase dialog */}
      {purchaseDialog && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setPurchaseDialog(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-10 animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-6" />
            <button
              onClick={() => setPurchaseDialog(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#3772FF]/10 flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-[#3772FF]" />
              </div>
              <h3 className="text-lg font-bold text-[#080708] mb-2">
                결제 시스템 준비 중입니다
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                온라인 결제는 곧 지원될 예정입니다.
                <br />
                센터에 직접 문의해주세요.
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm font-semibold text-[#3772FF]">
                <Phone className="w-4 h-4" />
                <span>02-1234-5678</span>
              </div>
            </div>
            <button
              onClick={() => setPurchaseDialog(false)}
              className="w-full mt-6 h-[52px] rounded-2xl bg-[#3772FF] text-sm font-semibold text-white transition-colors active:bg-[#3772FF]/90"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, onPurchase }: { plan: Plan; onPurchase: () => void }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
      {/* Badge */}
      {plan.badge && (
        <span
          className={`absolute top-4 right-4 text-[10px] font-bold px-2.5 py-1 rounded-full ${plan.badge.bg} ${plan.badge.color}`}
        >
          {plan.badge.label === "인기" && <Sparkles className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
          {plan.badge.label === "최저가" && <Star className="w-3 h-3 inline mr-0.5 -mt-0.5" />}
          {plan.badge.label}
        </span>
      )}

      <p className="text-base font-bold text-[#080708] mb-1">{plan.name}</p>

      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-2xl font-bold text-[#080708]">
          {"\u20A9"}{formatPrice(plan.price)}
        </span>
      </div>

      {plan.perSession && (
        <p className="text-xs text-gray-400">
          회당 {"\u20A9"}{formatPrice(plan.perSession)}
        </p>
      )}

      {plan.type === "period" && plan.periodMonths && (
        <p className="text-xs text-gray-400">
          {plan.periodMonths}개월 무제한 이용
        </p>
      )}

      <button
        onClick={onPurchase}
        className="w-full mt-4 h-[48px] rounded-2xl bg-[#080708] text-sm font-semibold text-white transition-all active:scale-[0.98] active:bg-[#080708]/90"
      >
        구매하기
      </button>
    </div>
  );
}
