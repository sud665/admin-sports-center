"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useDeleteInstructor, type Instructor } from "@/lib/hooks/use-instructors";
import { InstructorDialog } from "./instructor-dialog";
import { toast } from "sonner";

interface InstructorTableProps {
  instructors: Instructor[];
  isLoading: boolean;
}

export function InstructorTable({
  instructors,
  isLoading,
}: InstructorTableProps) {
  const [editTarget, setEditTarget] = useState<Instructor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Instructor | null>(null);
  const deleteMutation = useDeleteInstructor();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("강사가 비활성화되었습니다");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground py-8 text-center">불러오는 중...</p>;
  }

  if (instructors.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        등록된 강사가 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">색상</TableHead>
              <TableHead>이름</TableHead>
              <TableHead className="hidden md:table-cell">이메일</TableHead>
              <TableHead>요율</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="w-24">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {instructors.map((inst) => (
              <TableRow key={inst.id}>
                <TableCell>
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: inst.color || "#ccc" }}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/instructors/${inst.id}`} className="hover:underline">
                    {inst.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {inst.email}
                </TableCell>
                <TableCell>
                  {inst.rate ? `${inst.rate}%` : "-"}
                </TableCell>
                <TableCell>
                  <Badge variant={inst.isActive ? "default" : "secondary"}>
                    {inst.isActive ? "활성" : "비활성"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditTarget(inst)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(inst)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 수정 다이얼로그 */}
      <InstructorDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        instructor={editTarget}
      />

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>강사 비활성화</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} 강사를 비활성화하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "처리 중..." : "비활성화"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
