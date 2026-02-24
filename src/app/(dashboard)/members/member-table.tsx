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
import { useDeleteMember, type Member } from "@/lib/hooks/use-members";
import { MemberDialog } from "./member-dialog";
import { toast } from "sonner";

interface MemberTableProps {
  members: Member[];
  isLoading: boolean;
}

export function MemberTable({ members, isLoading }: MemberTableProps) {
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const deleteMutation = useDeleteMember();

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("회원이 비활성화되었습니다");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  if (isLoading) {
    return (
      <p className="text-muted-foreground py-8 text-center">불러오는 중...</p>
    );
  }

  if (members.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center">
        등록된 회원이 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>연락처</TableHead>
              <TableHead>담당 강사</TableHead>
              <TableHead className="hidden md:table-cell">메모</TableHead>
              <TableHead className="w-24">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">
                  <Link href={`/members/${m.id}`} className="hover:underline">
                    {m.name}
                  </Link>
                </TableCell>
                <TableCell>{m.phone || "-"}</TableCell>
                <TableCell>
                  {m.instructorName ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: m.instructorColor || "#ccc",
                        }}
                      />
                      {m.instructorName}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">미지정</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                  {m.memo || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditTarget(m)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(m)}
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

      <MemberDialog
        open={!!editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
        member={editTarget}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>회원 비활성화</DialogTitle>
            <DialogDescription>
              {deleteTarget?.name} 회원을 비활성화하시겠습니까?
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
