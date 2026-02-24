import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Slot {
  id: string;
  instructorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
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

export function useSlots(instructorId?: string) {
  const params = new URLSearchParams();
  if (instructorId) params.set("instructorId", instructorId);
  const qs = params.toString();

  return useQuery<Slot[]>({
    queryKey: ["slots", instructorId],
    queryFn: () => fetchJson(`/api/slots${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      instructorId?: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isRecurring?: boolean;
    }) =>
      fetchJson("/api/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["slots"] }),
  });
}

export function useDeleteSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/slots/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["slots"] }),
  });
}
