import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Member {
  id: string;
  name: string;
  phone: string | null;
  instructorId: string | null;
  instructorName: string | null;
  instructorColor: string | null;
  memo: string | null;
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

export function useMembers(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  const qs = params.toString();

  return useQuery<Member[]>({
    queryKey: ["members", search],
    queryFn: () => fetchJson(`/api/members${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      phone?: string;
      instructorId?: string;
      memo?: string;
    }) =>
      fetchJson("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      phone?: string;
      instructorId?: string | null;
      memo?: string;
      isActive?: boolean;
    }) =>
      fetchJson(`/api/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      fetchJson(`/api/members/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["members"] }),
  });
}
