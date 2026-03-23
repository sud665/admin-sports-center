"use client";

import { useState, useMemo } from "react";
import { useMembers } from "@/lib/hooks/use-members";
import { MemberDialog } from "@/components/members/member-dialog";
import { DeleteMemberDialog } from "@/components/members/delete-member-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Users,
  UserPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import type { Member } from "@/lib/hooks/use-members";

type FilterTab = "all" | "active" | "inactive";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [filter, setFilter] = useState<FilterTab>("all");
  const { data: members, isLoading } = useMembers(debouncedSearch);

  function handleSearchChange(value: string) {
    setSearch(value);
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  }

  const filteredMembers = useMemo(() => {
    if (!members) return [];
    if (filter === "active") return members.filter((m) => m.isActive);
    if (filter === "inactive") return members.filter((m) => !m.isActive);
    return members;
  }, [members, filter]);

  const totalCount = members?.length ?? 0;
  const activeCount = members?.filter((m) => m.isActive).length ?? 0;
  const inactiveCount = totalCount - activeCount;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">회원 관리</h2>
          <Badge className="bg-[#3772FF] text-white">{totalCount}명</Badge>
        </div>
        <Button
          onClick={() => {
            setEditTarget(null);
            setDialogOpen(true);
          }}
          className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" /> 회원 등록
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 또는 연락처 검색"
            className="pl-9 focus-visible:ring-[#3772FF]/30 focus-visible:border-[#3772FF]"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterTab)}
        >
          <TabsList>
            <TabsTrigger value="all">전체 ({totalCount})</TabsTrigger>
            <TabsTrigger value="active">활성 ({activeCount})</TabsTrigger>
            <TabsTrigger value="inactive">비활성 ({inactiveCount})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-muted-foreground py-16 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent mb-3" />
          <p>불러오는 중...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-[#3772FF]/10 p-4 mb-4">
            <Users className="h-10 w-10 text-[#3772FF]" />
          </div>
          <h3 className="text-lg font-semibold mb-1">등록된 회원이 없습니다</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {search
              ? "검색 결과가 없습니다. 다른 키워드로 검색해보세요."
              : "첫 회원을 등록해보세요"}
          </p>
          {!search && (
            <Button
              onClick={() => {
                setEditTarget(null);
                setDialogOpen(true);
              }}
              className="bg-[#3772FF] hover:bg-[#3772FF]/90 text-white"
            >
              <UserPlus className="mr-2 h-4 w-4" /> 첫 회원 등록하기
            </Button>
          )}
        </div>
      ) : (
        /* Member cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => (
            <Card
              key={m.id}
              className="transition-shadow duration-200 hover:shadow-md group"
            >
              <CardContent className="pt-0">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#3772FF] flex items-center justify-center text-white text-lg font-bold">
                    {m.name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-base truncate">
                        {m.name}
                      </h3>
                      <Badge
                        className={
                          m.isActive
                            ? "bg-[#3772FF]/10 text-[#3772FF] border-[#3772FF]/20"
                            : "bg-[#E6E8E6] text-[#080708]/60 border-[#E6E8E6]"
                        }
                      >
                        {m.isActive ? "활성" : "비활성"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-1">
                      {m.phone || "연락처 없음"}
                    </p>

                    {/* Instructor */}
                    <div className="flex items-center gap-1.5 text-sm mb-1">
                      {m.instructorName ? (
                        <>
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: m.instructorColor || "#ccc",
                            }}
                          />
                          <span className="truncate">{m.instructorName}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">강사 미지정</span>
                      )}
                    </div>

                    {/* Memo */}
                    {m.memo && (
                      <p className="text-xs text-muted-foreground truncate">
                        {m.memo}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  <Link href={`/members/${m.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[#3772FF] border-[#3772FF]/30 hover:bg-[#3772FF]/5"
                    >
                      상세보기
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditTarget(m);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#DF2935] hover:text-[#DF2935] hover:bg-[#DF2935]/10"
                    onClick={() => setDeleteTarget(m)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <MemberDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditTarget(null);
        }}
        member={editTarget}
      />

      <DeleteMemberDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        memberId={deleteTarget?.id ?? null}
        memberName={deleteTarget?.name ?? null}
      />
    </div>
  );
}
