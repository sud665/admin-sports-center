import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface Membership {
  id: string;
  memberId: string;
  memberName: string;
  type: "count" | "period";
  name: string;
  totalCount: number | null;
  remainingCount: number | null;
  startDate: string;
  endDate: string;
  price: number;
  status: "active" | "expired" | "paused";
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

export function useMemberships(status?: string) {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  const qs = params.toString();

  return useQuery<Membership[]>({
    queryKey: ["memberships", status],
    queryFn: () => fetchJson(`/api/memberships${qs ? `?${qs}` : ""}`),
  });
}

export function useCreateMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      memberId: string;
      type: "count" | "period";
      name: string;
      totalCount?: number | null;
      startDate: string;
      endDate: string;
      price: number;
    }) =>
      fetchJson("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memberships"] }),
  });
}

export function useUpdateMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: "active" | "expired" | "paused";
      remainingCount?: number;
    }) =>
      fetchJson(`/api/memberships/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memberships"] }),
  });
}
