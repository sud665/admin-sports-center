import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Booking {
  id: string;
  instructorId: string;
  instructorName: string | null;
  instructorColor: string | null;
  memberId: string;
  memberName: string | null;
  date: string;
  startTime: string;
  endTime: string;
  price: number;
  status: "booked" | "completed" | "cancelled";
  createdAt: string;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "요청에 실패했습니다");
  }
  return res.json();
}

export function useBookings(
  startDate?: string,
  endDate?: string,
  instructorId?: string
) {
  const params = new URLSearchParams();
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  if (instructorId) params.set("instructorId", instructorId);
  const qs = params.toString();

  return useQuery<Booking[]>({
    queryKey: ["bookings", startDate, endDate, instructorId],
    queryFn: () => fetchJson(`/api/bookings${qs ? `?${qs}` : ""}`),
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      instructorId: string;
      memberId: string;
      date: string;
      startTime: string;
      price: number;
    }) =>
      fetchJson("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      date?: string;
      startTime?: string;
      status?: "booked" | "completed" | "cancelled";
    }) =>
      fetchJson(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });
}
