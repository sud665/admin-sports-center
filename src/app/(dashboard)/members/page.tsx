"use client";

import { useState } from "react";
import { useMembers } from "@/lib/hooks/use-members";
import { MemberTable } from "./member-table";
import { MemberDialog } from "./member-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: members, isLoading } = useMembers(debouncedSearch);

  function handleSearchChange(value: string) {
    setSearch(value);
    // 간단한 디바운스
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">회원 관리</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 회원 등록
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="이름 또는 연락처 검색"
          className="pl-9"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <MemberTable members={members ?? []} isLoading={isLoading} />
      <MemberDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
