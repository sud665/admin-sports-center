"use client";

import { useState, useMemo } from "react";
import { usePrograms, useUpdateProgram } from "@/lib/hooks/use-programs";
import { ProgramDialog } from "@/components/programs/program-dialog";
import { DeleteProgramDialog } from "@/components/programs/delete-program-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import type { Program } from "@/lib/hooks/use-programs";

type CategoryTab = "all" | "pilates" | "yoga" | "pt" | "group";

const CATEGORY_LABELS: Record<string, string> = {
  pilates: "필라테스",
  yoga: "요가",
  pt: "PT",
  group: "그룹",
};

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  pilates: "bg-[#3772FF]/10 text-[#3772FF] border-[#3772FF]/20",
  yoga: "bg-[#FDCA40]/20 text-[#080708] border-[#FDCA40]/30",
  pt: "bg-[#DF2935]/10 text-[#DF2935] border-[#DF2935]/20",
  group: "bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20",
};

export default function ProgramsPage() {
  const [categoryTab, setCategoryTab] = useState<CategoryTab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Program | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Program | null>(null);
  const { data: programs, isLoading } = usePrograms();
  const updateProgram = useUpdateProgram();

  const filteredPrograms = useMemo(() => {
    if (!programs) return [];
    if (categoryTab === "all") return programs;
    return programs.filter((p) => p.category === categoryTab);
  }, [programs, categoryTab]);

  const totalCount = programs?.length ?? 0;
  const countByCategory = useMemo(() => {
    if (!programs) return { pilates: 0, yoga: 0, pt: 0, group: 0 };
    return {
      pilates: programs.filter((p) => p.category === "pilates").length,
      yoga: programs.filter((p) => p.category === "yoga").length,
      pt: programs.filter((p) => p.category === "pt").length,
      group: programs.filter((p) => p.category === "group").length,
    };
  }, [programs]);

  async function handleToggleActive(program: Program) {
    try {
      await updateProgram.mutateAsync({
        id: program.id,
        isActive: !program.isActive,
      });
      toast.success(
        program.isActive ? "프로그램이 비활성화되었습니다" : "프로그램이 활성화되었습니다"
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "오류가 발생했습니다");
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">수업 프로그램</h2>
          <Badge className="bg-[#3772FF] text-white">{totalCount}개</Badge>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setDialogOpen(true);
          }}
          className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> 프로그램 등록
        </Button>
      </div>

      {/* Category Tabs */}
      <div className="mb-6">
        <Tabs
          value={categoryTab}
          onValueChange={(v) => setCategoryTab(v as CategoryTab)}
        >
          <TabsList>
            <TabsTrigger value="all">전체 ({totalCount})</TabsTrigger>
            <TabsTrigger value="pilates">필라테스 ({countByCategory.pilates})</TabsTrigger>
            <TabsTrigger value="yoga">요가 ({countByCategory.yoga})</TabsTrigger>
            <TabsTrigger value="pt">PT ({countByCategory.pt})</TabsTrigger>
            <TabsTrigger value="group">그룹 ({countByCategory.group})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-muted-foreground py-16 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent mb-3" />
          <p>불러오는 중...</p>
        </div>
      ) : filteredPrograms.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[#3772FF]/10 p-4 mb-4">
            <BookOpen className="h-10 w-10 text-[#3772FF]" />
          </div>
          <h3 className="text-lg font-semibold mb-1">등록된 프로그램이 없습니다</h3>
          <p className="text-muted-foreground text-sm mb-6">
            첫 프로그램을 등록해보세요
          </p>
          <Button
            onClick={() => {
              setEditTarget(null);
              setDialogOpen(true);
            }}
            className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
          >
            <Plus className="mr-2 h-4 w-4" /> 첫 프로그램 등록하기
          </Button>
        </div>
      ) : (
        /* Program cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((p) => (
            <Card
              key={p.id}
              className="transition-shadow duration-200 hover:shadow-md group overflow-hidden"
            >
              <CardContent className="pt-0 pl-0">
                <div className="flex">
                  {/* Left color bar */}
                  <div
                    className="w-1 flex-shrink-0 rounded-l-lg"
                    style={{ backgroundColor: p.color }}
                  />

                  <div className="flex-1 pl-4 pr-1">
                    {/* Name + category badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base">{p.name}</h3>
                      <Badge
                        variant="outline"
                        className={`text-xs flex-shrink-0 ${CATEGORY_BADGE_STYLES[p.category] || ""}`}
                      >
                        {CATEGORY_LABELS[p.category] || p.category}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {p.description || "설명 없음"}
                    </p>

                    {/* Info row */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span>&#128336; {p.duration}분</span>
                      <span>&#183;</span>
                      <span>&#128101; 최대 {p.capacity}명</span>
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-1.5 text-sm mb-3">
                      {p.instructorName ? (
                        <>
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate">{p.instructorName}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">강사 미지정</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-3 border-t">
                      {/* Active toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(p)}
                        className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0
                          ${p.isActive ? "bg-[#3772FF]" : "bg-[#E6E8E6]"}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                            ${p.isActive ? "translate-x-4" : "translate-x-1"}
                          `}
                        />
                      </button>
                      <span className="text-xs text-muted-foreground">
                        {p.isActive ? "활성" : "비활성"}
                      </span>

                      <div className="flex-1" />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditTarget(p);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[#DF2935] hover:text-[#DF2935] hover:bg-[#DF2935]/10"
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ProgramDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditTarget(null);
        }}
        program={editTarget}
      />

      <DeleteProgramDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        programId={deleteTarget?.id ?? null}
        programName={deleteTarget?.name ?? null}
      />
    </div>
  );
}
