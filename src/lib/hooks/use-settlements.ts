import { useQuery } from "@tanstack/react-query";

export interface SettlementSummary {
  instructorId: string;
  instructorName: string;
  instructorColor: string | null;
  rate: string | null;
  lessonCount: number;
  totalRevenue: number;
  pay: number;
}

export interface SettlementDetail {
  instructor: {
    id: string;
    name: string;
    color: string | null;
    rate: string | null;
  };
  lessons: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    memberName: string | null;
    price: number;
    status: string;
  }[];
  summary: {
    lessonCount: number;
    totalRevenue: number;
    rate: number;
    pay: number;
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "요청에 실패했습니다");
  }
  return res.json();
}

export function useSettlements(year: number, month: number) {
  return useQuery<SettlementSummary[]>({
    queryKey: ["settlements", year, month],
    queryFn: () =>
      fetchJson(`/api/settlements?year=${year}&month=${month}`),
  });
}

export function useSettlementDetail(
  instructorId: string,
  year: number,
  month: number
) {
  return useQuery<SettlementDetail>({
    queryKey: ["settlement-detail", instructorId, year, month],
    queryFn: () =>
      fetchJson(
        `/api/settlements/${instructorId}?year=${year}&month=${month}`
      ),
    enabled: !!instructorId,
  });
}
