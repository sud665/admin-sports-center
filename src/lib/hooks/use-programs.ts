import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Program {
  id: string;
  name: string;
  description: string;
  category: "pilates" | "yoga" | "pt" | "group";
  duration: number;
  capacity: number;
  color: string;
  instructorId: string | null;
  instructorName: string | null;
  isActive: boolean;
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

export function usePrograms(category?: string) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  const qs = params.toString();

  return useQuery<Program[]>({
    queryKey: ["programs", category],
    queryFn: () => fetchJson(`/api/programs${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      category: string;
      duration: number;
      capacity: number;
      color: string;
      instructorId?: string;
    }) =>
      fetchJson("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      category?: string;
      duration?: number;
      capacity?: number;
      color?: string;
      instructorId?: string | null;
      isActive?: boolean;
    }) =>
      fetchJson(`/api/programs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}

export function useDeleteProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/programs/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["programs"] }),
  });
}
