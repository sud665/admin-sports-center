"use client";

import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { useDeleteProgram } from "@/lib/hooks/use-programs";
import { toast } from "sonner";

interface DeleteProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string | null;
  programName: string | null;
}

export function DeleteProgramDialog({
  open,
  onOpenChange,
  programId,
  programName,
}: DeleteProgramDialogProps) {
  const deleteMutation = useDeleteProgram();

  async function handleDelete() {
    if (!programId) return;
    try {
      await deleteMutation.mutateAsync(programId);
      toast.success("프로그램이 삭제되었습니다");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="프로그램 삭제"
      itemName={programName}
      description="이 프로그램의 모든 정보가 삭제됩니다"
      isPending={deleteMutation.isPending}
      onConfirm={handleDelete}
    />
  );
}
