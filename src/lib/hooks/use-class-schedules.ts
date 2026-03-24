import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ClassSchedule {
  id: string;
  programId: string;
  programName: string;
  programColor: string;
  category: string;
  instructorId: string;
  instructorName: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  duration: number;
  capacity: number;
  enrolled: number; // current bookings count
  isActive: boolean;
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "요청에 실패했습니다");
  }
  return res.json();
}

export function useClassSchedules(dayOfWeek?: number) {
  const params = new URLSearchParams();
  if (dayOfWeek !== undefined) params.set("dayOfWeek", String(dayOfWeek));
  const qs = params.toString();

  return useQuery<ClassSchedule[]>({
    queryKey: ["classSchedules", dayOfWeek],
    queryFn: () => fetchJson(`/api/class-schedules${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      programId: string;
      instructorId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }) =>
      fetchJson("/api/class-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classSchedules"] }),
  });
}

export function useUpdateClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      programId?: string;
      instructorId?: string;
      dayOfWeek?: number;
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
    }) =>
      fetchJson(`/api/class-schedules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classSchedules"] }),
  });
}

export function useDeleteClassSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/class-schedules/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["classSchedules"] }),
  });
}

export function useBookClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      scheduleId: string;
      date: string;
      memberId: string;
    }) =>
      fetchJson("/api/class-bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classSchedules"] });
      qc.invalidateQueries({ queryKey: ["classBookings"] });
      qc.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
