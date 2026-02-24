"use client";

import { useState } from "react";
import { useSlots, useCreateSlot, useDeleteSlot, type Slot } from "@/lib/hooks/use-slots";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

export default function MySlotsPage() {
  const { data: slots, isLoading } = useSlots();
  const createSlot = useCreateSlot();
  const deleteSlot = useDeleteSlot();

  const [form, setForm] = useState({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createSlot.mutateAsync({
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
      });
      toast.success("수업 가능 시간이 등록되었습니다");
      setForm({ dayOfWeek: "", startTime: "", endTime: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSlot.mutateAsync(id);
      toast.success("삭제되었습니다");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  // 요일별로 그룹핑
  const grouped: Record<number, Slot[]> = {};
  (slots ?? []).forEach((s) => {
    if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = [];
    grouped[s.dayOfWeek].push(s);
  });

  // 시간순 정렬
  Object.values(grouped).forEach((arr) =>
    arr.sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">수업 가능 시간</h2>

      {/* 등록 폼 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">시간 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAdd}
            className="flex flex-col sm:flex-row gap-3 items-end"
          >
            <div className="space-y-1 w-full sm:w-auto">
              <Label>요일</Label>
              <Select
                value={form.dayOfWeek}
                onValueChange={(v) => setForm({ ...form, dayOfWeek: v })}
                required
              >
                <SelectTrigger className="w-full sm:w-24">
                  <SelectValue placeholder="요일" />
                </SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((name, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {name}요일
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 w-full sm:w-auto">
              <Label>시작</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                required
                className="w-full sm:w-32"
              />
            </div>
            <div className="space-y-1 w-full sm:w-auto">
              <Label>종료</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
                className="w-full sm:w-32"
              />
            </div>
            <Button type="submit" disabled={createSlot.isPending}>
              <Plus className="mr-1 h-4 w-4" />
              추가
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 요일별 시간표 */}
      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">불러오는 중...</p>
      ) : (slots ?? []).length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          등록된 수업 가능 시간이 없습니다.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const daySlots = grouped[day];
            if (!daySlots || daySlots.length === 0) return null;
            return (
              <Card key={day}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {DAY_NAMES[day]}요일
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {daySlots.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm bg-muted rounded px-3 py-2"
                    >
                      <span>
                        {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
