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
  useCreateInstructor,
  useUpdateInstructor,
  type Instructor,
} from "@/lib/hooks/use-instructors";
import { toast } from "sonner";

interface InstructorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructor?: Instructor | null;
}

const DEFAULT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export function InstructorDialog({
  open,
  onOpenChange,
  instructor,
}: InstructorDialogProps) {
  const isEdit = !!instructor;
  const create = useCreateInstructor();
  const update = useUpdateInstructor();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    color: DEFAULT_COLORS[0],
    rate: "",
  });

  useEffect(() => {
    if (instructor) {
      setForm({
        name: instructor.name,
        email: instructor.email,
        password: "",
        color: instructor.color || DEFAULT_COLORS[0],
        rate: instructor.rate || "",
      });
    } else {
      setForm({
        name: "",
        email: "",
        password: "",
        color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
        rate: "",
      });
    }
  }, [instructor, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (isEdit) {
        await update.mutateAsync({
          id: instructor!.id,
          name: form.name,
          color: form.color,
          rate: form.rate || undefined,
        });
        toast.success("강사 정보가 수정되었습니다");
      } else {
        await create.mutateAsync({
          name: form.name,
          email: form.email,
          password: form.password,
          color: form.color,
          rate: form.rate || undefined,
        });
        toast.success("강사가 등록되었습니다");
      }
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "강사 수정" : "강사 등록"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">이름 *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">이메일 *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  minLength={4}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-7 h-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? "#000" : "transparent",
                    }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
              <Input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-10 h-8 p-0 border-0 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">정산 요율 (%)</Label>
            <Input
              id="rate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="예: 40"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
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
              {isPending ? "처리 중..." : isEdit ? "수정" : "등록"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
