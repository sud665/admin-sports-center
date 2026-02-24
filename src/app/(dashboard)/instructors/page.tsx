"use client";

import { useState } from "react";
import { useInstructors } from "@/lib/hooks/use-instructors";
import { InstructorTable } from "./instructor-table";
import { InstructorDialog } from "./instructor-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function InstructorsPage() {
  const { data: instructors, isLoading } = useInstructors();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">강사 관리</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> 강사 등록
        </Button>
      </div>
      <InstructorTable instructors={instructors ?? []} isLoading={isLoading} />
      <InstructorDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
