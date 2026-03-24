"use client";

import { useState, useMemo } from "react";
import {
  useMemberships,
  useCreateMembership,
  useUpdateMembership,
  type Membership,
} from "@/lib/hooks/use-memberships";
import { useMembers } from "@/lib/hooks/use-members";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CreditCard, Pause, Play, Pencil } from "lucide-react";
import { toast } from "sonner";

type FilterTab = "all" | "active" | "expired" | "paused";

const PRESET_NAMES: Record<string, { name: string; type: "count" | "period"; totalCount?: number }> = {
  "10회권": { name: "10회 수강권", type: "count", totalCount: 10 },
  "30회권": { name: "30회 수강권", type: "count", totalCount: 30 },
  "50회권": { name: "50회 수강권", type: "count", totalCount: 50 },
  "1개월": { name: "1개월 무제한", type: "period" },
  "3개월": { name: "3개월 무제한", type: "period" },
  "6개월": { name: "6개월 무제한", type: "period" },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(price);
}

function getDaysInfo(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  return { totalDays, remainingDays };
}

function getProgressColor(ratio: number): string {
  if (ratio > 0.3) return "#3772FF";
  if (ratio > 0.1) return "#FDCA40";
  return "#DF2935";
}

function getStatusDot(status: string) {
  if (status === "active") return "bg-green-500";
  if (status === "expired") return "bg-[#DF2935]";
  return "bg-[#FDCA40]";
}

function getStatusLabel(status: string) {
  if (status === "active") return "활성";
  if (status === "expired") return "만료";
  return "일시정지";
}

export default function MembershipsPage() {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: memberships, isLoading } = useMemberships();
  const updateMembership = useUpdateMembership();

  const filteredMemberships = useMemo(() => {
    if (!memberships) return [];
    if (filter === "all") return memberships;
    return memberships.filter((ms) => ms.status === filter);
  }, [memberships, filter]);

  const totalCount = memberships?.length ?? 0;
  const activeCount = memberships?.filter((ms) => ms.status === "active").length ?? 0;
  const expiredCount = memberships?.filter((ms) => ms.status === "expired").length ?? 0;
  const pausedCount = memberships?.filter((ms) => ms.status === "paused").length ?? 0;

  async function handleTogglePause(ms: Membership) {
    const newStatus = ms.status === "paused" ? "active" : "paused";
    try {
      await updateMembership.mutateAsync({ id: ms.id, status: newStatus });
      toast.success(newStatus === "paused" ? "수강권이 일시정지되었습니다" : "수강권이 재개되었습니다");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">수강권 관리</h2>
          <Badge className="bg-[#3772FF] text-white">{totalCount}건</Badge>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> 수강권 발급
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterTab)}>
          <TabsList>
            <TabsTrigger value="all">전체 ({totalCount})</TabsTrigger>
            <TabsTrigger value="active">활성 ({activeCount})</TabsTrigger>
            <TabsTrigger value="expired">만료 ({expiredCount})</TabsTrigger>
            <TabsTrigger value="paused">일시정지 ({pausedCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-muted-foreground py-16 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent mb-3" />
          <p>불러오는 중...</p>
        </div>
      ) : filteredMemberships.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[#3772FF]/10 p-4 mb-4">
            <CreditCard className="h-10 w-10 text-[#3772FF]" />
          </div>
          <h3 className="text-lg font-semibold mb-1">등록된 수강권이 없습니다</h3>
          <p className="text-muted-foreground text-sm mb-6">
            첫 수강권을 발급해보세요
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> 수강권 발급하기
          </Button>
        </div>
      ) : (
        /* Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemberships.map((ms) => {
            const isCount = ms.type === "count";
            let ratio = 0;
            let progressLabel = "";

            if (isCount && ms.totalCount) {
              ratio = ms.remainingCount! / ms.totalCount;
              progressLabel = `잔여 ${ms.remainingCount}회`;
            } else {
              const { totalDays, remainingDays } = getDaysInfo(ms.startDate, ms.endDate);
              ratio = remainingDays / totalDays;
              progressLabel = remainingDays > 0 ? `D-${remainingDays}` : "만료";
            }

            const progressColor = getProgressColor(ratio);

            return (
              <Card
                key={ms.id}
                className="transition-shadow duration-200 hover:shadow-md group"
              >
                <CardContent className="pt-0">
                  {/* Header: Member name + type badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="font-bold text-base truncate">{ms.memberName}</h3>
                      <Badge
                        className={
                          isCount
                            ? "bg-[#3772FF]/10 text-[#3772FF] border-[#3772FF]/20 flex-shrink-0"
                            : "bg-[#FDCA40]/20 text-[#080708] border-[#FDCA40]/30 flex-shrink-0"
                        }
                      >
                        {isCount ? "회차제" : "기간제"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={`inline-block w-2 h-2 rounded-full ${getStatusDot(ms.status)}`} />
                      <span className="text-xs text-muted-foreground">{getStatusLabel(ms.status)}</span>
                    </div>
                  </div>

                  {/* Membership name */}
                  <p className="text-sm text-muted-foreground mb-3">{ms.name}</p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium" style={{ color: progressColor }}>
                        {progressLabel}
                      </span>
                      {isCount && ms.totalCount && (
                        <span className="text-muted-foreground text-xs">
                          {ms.remainingCount}/{ms.totalCount}회
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-[#E6E8E6] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(2, ratio * 100)}%`,
                          backgroundColor: progressColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <p className="text-lg font-bold mb-2">{formatPrice(ms.price)}</p>

                  {/* Dates */}
                  <p className="text-xs text-muted-foreground mb-4">
                    {ms.startDate} ~ {ms.endDate}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t">
                    {ms.status !== "expired" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          ms.status === "paused"
                            ? "text-[#3772FF] border-[#3772FF]/30 hover:bg-[#3772FF]/5"
                            : "text-[#FDCA40] border-[#FDCA40]/30 hover:bg-[#FDCA40]/5"
                        }
                        onClick={() => handleTogglePause(ms)}
                        disabled={updateMembership.isPending}
                      >
                        {ms.status === "paused" ? (
                          <>
                            <Play className="mr-1 h-3.5 w-3.5" /> 재개
                          </>
                        ) : (
                          <>
                            <Pause className="mr-1 h-3.5 w-3.5" /> 일시정지
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" /> 수정
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <MembershipDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

/* ─── Membership Dialog ─── */

interface MembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MembershipDialog({ open, onOpenChange }: MembershipDialogProps) {
  const create = useCreateMembership();
  const { data: members } = useMembers();

  const [form, setForm] = useState({
    memberId: "",
    preset: "",
    type: "count" as "count" | "period",
    name: "",
    totalCount: 10,
    startDate: "",
    endDate: "",
    price: 0,
  });

  function handlePresetChange(preset: string) {
    if (preset === "custom") {
      setForm({ ...form, preset, name: "", type: "count", totalCount: 10 });
      return;
    }
    const p = PRESET_NAMES[preset];
    if (p) {
      setForm({
        ...form,
        preset,
        name: p.name,
        type: p.type,
        totalCount: p.totalCount ?? 0,
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.memberId || !form.name.trim() || !form.startDate || !form.endDate) {
      toast.error("필수 항목을 입력해주세요");
      return;
    }

    try {
      await create.mutateAsync({
        memberId: form.memberId,
        type: form.type,
        name: form.name.trim(),
        totalCount: form.type === "count" ? form.totalCount : null,
        startDate: form.startDate,
        endDate: form.endDate,
        price: form.price,
      });
      toast.success("수강권이 발급되었습니다");
      onOpenChange(false);
      setForm({
        memberId: "",
        preset: "",
        type: "count",
        name: "",
        totalCount: 10,
        startDate: "",
        endDate: "",
        price: 0,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">수강권 발급</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Member select */}
          <div className="space-y-2">
            <Label>
              회원 <span className="text-[#DF2935]">*</span>
            </Label>
            <Select
              value={form.memberId}
              onValueChange={(v) => setForm({ ...form, memberId: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="회원 선택" />
              </SelectTrigger>
              <SelectContent>
                {(members ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset select */}
          <div className="space-y-2">
            <Label>
              수강권 종류 <span className="text-[#DF2935]">*</span>
            </Label>
            <Select
              value={form.preset}
              onValueChange={handlePresetChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="수강권 선택" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PRESET_NAMES).map((key) => (
                  <SelectItem key={key} value={key}>
                    {PRESET_NAMES[key].name}
                  </SelectItem>
                ))}
                <SelectItem value="custom">직접 입력</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom name (only if custom) */}
          {form.preset === "custom" && (
            <>
              <div className="space-y-2">
                <Label>유형</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as "count" | "period" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">회차제</SelectItem>
                    <SelectItem value="period">기간제</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>수강권 이름</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="예: 20회 수강권"
                />
              </div>
            </>
          )}

          {/* Total count (count type only) */}
          {form.type === "count" && (
            <div className="space-y-2">
              <Label>총 횟수</Label>
              <Input
                type="number"
                min={1}
                value={form.totalCount}
                onChange={(e) => setForm({ ...form, totalCount: parseInt(e.target.value) || 0 })}
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                시작일 <span className="text-[#DF2935]">*</span>
              </Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>
                종료일 <span className="text-[#DF2935]">*</span>
              </Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label>
              금액 (원) <span className="text-[#DF2935]">*</span>
            </Label>
            <Input
              type="number"
              min={0}
              step={10000}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
              placeholder="500000"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={create.isPending}
              className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
            >
              {create.isPending ? "처리 중..." : "발급"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
