"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteProgram } from "@/lib/hooks/use-programs";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#DF2935]">
            <AlertTriangle className="h-5 w-5" />
            프로그램 삭제
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm">
            정말 삭제하시겠습니까?
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted/50 p-3 text-center">
          <p className="font-semibold text-base">{programName}</p>
          <p className="text-muted-foreground text-xs mt-1">
            이 프로그램의 모든 정보가 삭제됩니다
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="bg-[#DF2935] hover:bg-[#DF2935]/90 text-white"
          >
            {deleteMutation.isPending ? "처리 중..." : "삭제"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
