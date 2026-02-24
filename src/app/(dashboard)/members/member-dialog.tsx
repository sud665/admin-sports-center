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
import { useCreateMember, useUpdateMember, type Member } from "@/lib/hooks/use-members";
import { useInstructors } from "@/lib/hooks/use-instructors";
import { toast } from "sonner";

interface MemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
}

export function MemberDialog({ open, onOpenChange, member }: MemberDialogProps) {
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
  }, [member, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (isEdit) {
        await update.mutateAsync({
          id: member!.id,
          name: form.name,
          phone: form.phone || undefined,
          instructorId: form.instructorId || null,
          memo: form.memo || undefined,
        });
        toast.success("회원 정보가 수정되었습니다");
      } else {
        await create.mutateAsync({
          name: form.name,
          phone: form.phone || undefined,
          instructorId: form.instructorId || undefined,
          memo: form.memo || undefined,
        });
        toast.success("회원이 등록되었습니다");
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
          <DialogTitle>{isEdit ? "회원 수정" : "회원 등록"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-name">이름 *</Label>
            <Input
              id="member-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
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
              <SelectTrigger>
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
            <Input
              id="member-memo"
              placeholder="특이사항 등"
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
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
