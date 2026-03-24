import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, requireAdmin } from "@/lib/api-utils";
import { isMockMode } from "@/lib/mock-data";

function getMockAnalytics(period: string) {
  const monthlyRevenue =
    period === "year"
      ? [
          { month: "1월", amount: 2800000 },
          { month: "2월", amount: 3200000 },
          { month: "3월", amount: 4100000 },
          { month: "4월", amount: 3600000 },
          { month: "5월", amount: 3900000 },
          { month: "6월", amount: 4500000 },
          { month: "7월", amount: 4200000 },
          { month: "8월", amount: 3800000 },
          { month: "9월", amount: 4600000 },
          { month: "10월", amount: 5100000 },
          { month: "11월", amount: 4800000 },
          { month: "12월", amount: 5200000 },
        ]
      : period === "quarter"
        ? [
            { month: "1월", amount: 4600000 },
            { month: "2월", amount: 4800000 },
            { month: "3월", amount: 5200000 },
          ]
        : [
            { month: "1주", amount: 980000 },
            { month: "2주", amount: 1150000 },
            { month: "3주", amount: 1320000 },
            { month: "4주", amount: 1450000 },
          ];

  const total = monthlyRevenue.reduce((s, m) => s + m.amount, 0);

  const monthlyMembers =
    period === "year"
      ? [
          { month: "1월", newMembers: 5, leftMembers: 1 },
          { month: "2월", newMembers: 8, leftMembers: 2 },
          { month: "3월", newMembers: 6, leftMembers: 0 },
          { month: "4월", newMembers: 4, leftMembers: 1 },
          { month: "5월", newMembers: 7, leftMembers: 3 },
          { month: "6월", newMembers: 9, leftMembers: 1 },
          { month: "7월", newMembers: 6, leftMembers: 2 },
          { month: "8월", newMembers: 5, leftMembers: 1 },
          { month: "9월", newMembers: 8, leftMembers: 0 },
          { month: "10월", newMembers: 10, leftMembers: 2 },
          { month: "11월", newMembers: 7, leftMembers: 1 },
          { month: "12월", newMembers: 9, leftMembers: 2 },
        ]
      : period === "quarter"
        ? [
            { month: "1월", newMembers: 8, leftMembers: 2 },
            { month: "2월", newMembers: 10, leftMembers: 1 },
            { month: "3월", newMembers: 9, leftMembers: 2 },
          ]
        : [
            { month: "1주", newMembers: 2, leftMembers: 0 },
            { month: "2주", newMembers: 3, leftMembers: 1 },
            { month: "3주", newMembers: 1, leftMembers: 0 },
            { month: "4주", newMembers: 3, leftMembers: 1 },
          ];

  return {
    revenue: {
      monthly: monthlyRevenue,
      total,
      growth: 12.5,
    },
    members: {
      monthly: monthlyMembers,
      totalActive: 6,
      growth: 15.0,
    },
    instructors: [
      {
        name: "김태권",
        color: "#3B82F6",
        lessons: 45,
        revenue: 2250000,
        attendanceRate: 92,
      },
      {
        name: "이합기",
        color: "#10B981",
        lessons: 38,
        revenue: 1900000,
        attendanceRate: 88,
      },
    ],
    programs: [
      { name: "필라테스 기초", color: "#3772FF", bookings: 35, percentage: 28 },
      { name: "빈야사 요가", color: "#FDCA40", bookings: 30, percentage: 24 },
      { name: "필라테스 중급", color: "#DF2935", bookings: 25, percentage: 20 },
      { name: "1:1 PT", color: "#8B5CF6", bookings: 20, percentage: 16 },
      { name: "기타", color: "#E6E8E6", bookings: 15, percentage: 12 },
    ],
  };
}

export async function GET(request: NextRequest) {
  const { session, error } = await getAuthSession();
  if (error) return error;

  const adminError = requireAdmin(session!);
  if (adminError) return adminError;

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";

  if (isMockMode()) {
    return NextResponse.json(getMockAnalytics(period));
  }

  // Real DB queries would go here
  return NextResponse.json(getMockAnalytics(period));
}
