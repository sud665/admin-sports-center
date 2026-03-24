import { useQuery } from "@tanstack/react-query";

export interface RevenueData {
  monthly: { month: string; amount: number }[];
  total: number;
  growth: number;
}

export interface MembersData {
  monthly: { month: string; newMembers: number; leftMembers: number }[];
  totalActive: number;
  growth: number;
}

export interface InstructorPerformance {
  name: string;
  color: string;
  lessons: number;
  revenue: number;
  attendanceRate: number;
}

export interface ProgramPopularity {
  name: string;
  color: string;
  bookings: number;
  percentage: number;
}

export interface AnalyticsData {
  revenue: RevenueData;
  members: MembersData;
  instructors: InstructorPerformance[];
  programs: ProgramPopularity[];
}

export function useAnalytics(period: string) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (!res.ok) throw new Error("통계 데이터를 불러올 수 없습니다");
      return res.json();
    },
  });
}
