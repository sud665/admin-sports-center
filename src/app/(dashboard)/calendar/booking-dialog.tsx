"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCreateBooking, useUpdateBooking, useCancelBooking, type Booking } from "@/lib/hooks/use-bookings";
import { useInstructors } from "@/lib/hooks/use-instructors";
import { useMembers } from "@/lib/hooks/use-members";
import { toast } from "sonner";

interface BookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking?: Booking | null;
  defaultDate?: string;
  defaultTime?: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  booked: { label: "예약", variant: "default" },
  completed: { label: "완료", variant: "secondary" },
  cancelled: { label: "취소", variant: "destructive" },
};

export function BookingDialog({
  open,
  onOpenChange,
  booking,
  defaultDate,
  defaultTime,
}: BookingDialogProps) {
  const isDetail = !!booking;
  const create = useCreateBooking();
  const update = useUpdateBooking();
  const cancel = useCancelBooking();
  const { data: instructors } = useInstructors();
  const { data: members } = useMembers();

  const [form, setForm] = useState({
    instructorId: "",
    memberId: "",
    date: "",
    startTime: "",
    price: "",
  });

  useEffect(() => {
    if (booking) {
      setForm({
        instructorId: booking.instructorId,
        memberId: booking.memberId,
        date: booking.date,
        startTime: booking.startTime.slice(0, 5),
        price: String(booking.price),
      });
    } else {
      setForm({
        instructorId: "",
        memberId: "",
        date: defaultDate || "",
        startTime: defaultTime || "",
        price: "",
      });
    }
  }, [booking, defaultDate, defaultTime, open]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await create.mutateAsync({
        instructorId: form.instructorId,
        memberId: form.memberId,
        date: form.date,
        startTime: form.startTime,
        price: Number(form.price),
      });
      toast.success("예약이 등록되었습니다");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleStatusChange(status: "completed" | "cancelled") {
    if (!booking) return;
    try {
      if (status === "cancelled") {
        await cancel.mutateAsync(booking.id);
        toast.success("예약이 취소되었습니다");
      } else {
        await update.mutateAsync({ id: booking.id, status });
        toast.success("수업이 완료 처리되었습니다");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const isPending = create.isPending || update.isPending || cancel.isPending;

  // 상세 보기 모드
  if (isDetail) {
    const statusInfo = STATUS_LABELS[booking.status];
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>예약 상세</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">상태</span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">강사</span>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: booking.instructorColor || "#ccc" }}
                />
                {booking.instructorName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">회원</span>
              <span>{booking.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">날짜</span>
              <span>{booking.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">시간</span>
              <span>
                {booking.startTime.slice(0, 5)} - {booking.endTime.slice(0, 5)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">수강료</span>
              <span>{booking.price.toLocaleString()}원</span>
            </div>
          </div>
          {booking.status === "booked" && (
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => handleStatusChange("cancelled")}
                disabled={isPending}
              >
                예약 취소
              </Button>
              <Button
                onClick={() => handleStatusChange("completed")}
                disabled={isPending}
              >
                수업 완료
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // 생성 모드
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>예약 등록</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label>강사 *</Label>
            <Select
              value={form.instructorId}
              onValueChange={(v) => setForm({ ...form, instructorId: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="강사 선택" />
              </SelectTrigger>
              <SelectContent>
                {(instructors ?? [])
                  .filter((i) => i.isActive)
                  .map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block w-3 h-3 rounded-full"
                          style={{ backgroundColor: inst.color || "#ccc" }}
                        />
                        {inst.name}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>회원 *</Label>
            <Select
              value={form.memberId}
              onValueChange={(v) => setForm({ ...form, memberId: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="회원 선택" />
              </SelectTrigger>
              <SelectContent>
                {(members ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} {m.phone ? `(${m.phone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="booking-date">날짜 *</Label>
              <Input
                id="booking-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-time">시작 시간 *</Label>
              <Input
                id="booking-time"
                type="time"
                step="600"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking-price">수강료 (원) *</Label>
            <Input
              id="booking-price"
              type="number"
              min="0"
              step="1000"
              placeholder="예: 50000"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "처리 중..." : "예약 등록"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
