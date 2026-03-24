import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AttendanceRecord {
  bookingId: string;
  memberId: string;
  memberName: string;
  instructorName: string;
  instructorColor: string;
  startTime: string;
  endTime: string;
  status: "booked" | "completed" | "cancelled";
  isCheckedIn: boolean;
  checkInTime: string | null;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "요청에 실패했습니다");
  }
  return res.json();
}

export function useTodayAttendance() {
  return useQuery<AttendanceRecord[]>({
    queryKey: ["attendance", "today"],
    queryFn: () => fetchJson("/api/attendance?date=today"),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { bookingId: string; method?: string }) =>
      fetchJson("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) =>
      fetchJson(`/api/attendance/${bookingId}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}
