"use client";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { useDeleteMember } from "@/lib/hooks/use-members";
import { toast } from "sonner";

interface DeleteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string | null;
  memberName: string | null;
  onDeleted?: () => void;
}

export function DeleteMemberDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  onDeleted,
}: DeleteMemberDialogProps) {
  const deleteMutation = useDeleteMember();

  async function handleDelete() {
    if (!memberId) return;
    try {
      await deleteMutation.mutateAsync(memberId);
      toast.success("회원이 삭제되었습니다");
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="회원 삭제"
      itemName={memberName}
      description="이 회원의 모든 정보가 삭제됩니다"
      isPending={deleteMutation.isPending}
      onConfirm={handleDelete}
    />
  );
}
