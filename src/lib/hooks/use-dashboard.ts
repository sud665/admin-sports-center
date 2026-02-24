import { useQuery } from "@tanstack/react-query";

export interface DashboardData {
  todayCount: number;
  weekCount: number;
  instructorCount: number;
  memberCount: number;
  todayBookings: {
    id: string;
    startTime: string;
    endTime: string;
    instructorName: string | null;
    instructorColor: string | null;
    memberName: string | null;
    status: string;
  }[];
  isAdmin: boolean;
}

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("불러오기 실패");
      return res.json();
    },
  });
}
