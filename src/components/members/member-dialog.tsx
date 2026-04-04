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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateMember,
  useUpdateMember,
  type Member,
} from "@/lib/hooks/use-members";
import { useInstructors } from "@/lib/hooks/use-instructors";
import { toast } from "sonner";

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
}

export function MemberDialog({
  open,
  onOpenChange,
  member,
}: MemberDialogProps) {
  const isEdit = !!member;
  const create = useCreateMember();
  const update = useUpdateMember();
  const { data: instructors } = useInstructors();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    instructorId: "",
    memo: "",
  });

  const [nameError, setNameError] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (member) {
      setForm({
        name: member.name,
        phone: member.phone || "",
        instructorId: member.instructorId || "",
        memo: member.memo || "",
      });
    } else {
      setForm({ name: "", phone: "", instructorId: "", memo: "" });
    }
    setNameError(false);
  }, [member, open]);
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
          id: member!.id,
          name: form.name.trim(),
          phone: form.phone || undefined,
          instructorId: form.instructorId || null,
          memo: form.memo || undefined,
        });
        toast.success("회원 정보가 수정되었습니다");
      } else {
        await create.mutateAsync({
          name: form.name.trim(),
          phone: form.phone || undefined,
          instructorId: form.instructorId || undefined,
          memo: form.memo || undefined,
        });
        toast.success("회원이 등록되었습니다");
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
            {isEdit ? "회원 수정" : "회원 등록"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">
              이름 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="member-name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (e.target.value.trim()) setNameError(false);
              }}
              aria-invalid={nameError}
              aria-describedby={nameError ? "member-name-error" : undefined}
              className={nameError ? "border-destructive focus-visible:ring-destructive/30" : ""}
              placeholder="회원 이름"
            />
            {nameError && (
              <p id="member-name-error" role="alert" className="text-xs text-destructive">
                이름을 입력해주세요
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="member-phone">연락처</Label>
            <Input
              id="member-phone"
              type="tel"
              placeholder="010-0000-0000"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
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
                <SelectValue placeholder="강사 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">미지정</SelectItem>
                {(instructors ?? [])
                  .filter((i) => i.isActive)
                  .map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
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
            <Label htmlFor="member-memo">메모</Label>
            <Textarea
              id="member-memo"
              placeholder="특이사항, 주의사항 등"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              rows={3}
              className="resize-none"
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
