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
import {
  useCreateProgram,
  useUpdateProgram,
  type Program,
} from "@/lib/hooks/use-programs";
import { useInstructors } from "@/lib/hooks/use-instructors";
import { toast } from "sonner";

const PRESET_COLORS = [
  { label: "Blue", value: "#3772FF" },
  { label: "Red", value: "#DF2935" },
  { label: "Yellow", value: "#FDCA40" },
  { label: "Green", value: "#10B981" },
  { label: "Purple", value: "#8B5CF6" },
  { label: "Orange", value: "#F97316" },
];

const CATEGORIES = [
  { label: "필라테스", value: "pilates" },
  { label: "요가", value: "yoga" },
  { label: "PT", value: "pt" },
  { label: "그룹", value: "group" },
];

interface ProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: Program | null;
}

export function ProgramDialog({
  open,
  onOpenChange,
  program,
}: ProgramDialogProps) {
  const isEdit = !!program;
  const create = useCreateProgram();
  const update = useUpdateProgram();
  const { data: instructors } = useInstructors();

  const [form, setForm] = useState({
    name: "",
    category: "pilates",
    description: "",
    duration: "50",
    capacity: "6",
    color: "#3772FF",
    instructorId: "",
  });

  const [nameError, setNameError] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (program) {
      setForm({
        name: program.name,
        category: program.category,
        description: program.description,
        duration: String(program.duration),
        capacity: String(program.capacity),
        color: program.color,
        instructorId: program.instructorId || "",
      });
    } else {
      setForm({
        name: "",
        category: "pilates",
        description: "",
        duration: "50",
        capacity: "6",
        color: "#3772FF",
        instructorId: "",
      });
    }
    setNameError(false);
  }, [program, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setNameError(true);
      return;
    }

    try {
      if (isEdit) {
        await update.mutateAsync({
          id: program!.id,
          name: form.name.trim(),
          category: form.category,
          description: form.description,
          duration: parseInt(form.duration) || 50,
          capacity: parseInt(form.capacity) || 1,
          color: form.color,
          instructorId: form.instructorId || null,
        });
        toast.success("프로그램이 수정되었습니다");
      } else {
        await create.mutateAsync({
          name: form.name.trim(),
          category: form.category,
          description: form.description,
          duration: parseInt(form.duration) || 50,
          capacity: parseInt(form.capacity) || 1,
          color: form.color,
          instructorId: form.instructorId || undefined,
        });
        toast.success("프로그램이 등록되었습니다");
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit ? "프로그램 수정" : "프로그램 등록"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="program-name">
              프로그램명 <span className="text-[#DF2935]">*</span>
            </Label>
            <Input
              id="program-name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (e.target.value.trim()) setNameError(false);
              }}
              className={nameError ? "border-[#DF2935] focus-visible:ring-[#DF2935]/30" : ""}
              placeholder="프로그램 이름"
            />
            {nameError && (
              <p className="text-xs text-[#DF2935]">프로그램명을 입력해주세요</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>카테고리 <span className="text-[#DF2935]">*</span></Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="program-desc">설명</Label>
            <textarea
              id="program-desc"
              placeholder="프로그램 설명"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program-duration">수업 시간 (분)</Label>
              <Input
                id="program-duration"
                type="number"
                min={10}
                max={180}
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-capacity">정원 (명)</Label>
              <Input
                id="program-capacity"
                type="number"
                min={1}
                max={100}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="6"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, color: c.value })}
                  className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: c.value,
                    borderColor: form.color === c.value ? "#080708" : "transparent",
                  }}
                  title={c.label}
                >
                  {form.color === c.value && (
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>담당 강사</Label>
            <Select
              value={form.instructorId}
              onValueChange={(v) =>
                setForm({ ...form, instructorId: v === "none" ? "" : v })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="강사 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미지정</SelectItem>
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
              disabled={isPending}
              className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
            >
              {isPending ? "처리 중..." : isEdit ? "수정" : "등록"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
