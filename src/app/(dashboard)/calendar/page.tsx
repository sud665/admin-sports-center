"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CalendarView } from "./calendar-view";
import { useInstructors } from "@/lib/hooks/use-instructors";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const { data: session } = useSession();
  const { data: instructors } = useInstructors();
  const [selectedInstructor, setSelectedInstructor] = useState<string>("");

  const isAdmin = session?.user?.role === "admin";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {isAdmin ? "캘린더" : "내 캘린더"}
        </h2>
      </div>

      {/* 강사 필터 (admin만) */}
      {isAdmin && instructors && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant={selectedInstructor === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedInstructor("")}
          >
            전체
          </Button>
          {instructors
            .filter((i) => i.isActive)
            .map((inst) => (
              <Button
                key={inst.id}
                variant={
                  selectedInstructor === inst.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedInstructor(inst.id)}
                className={cn(
                  selectedInstructor === inst.id && "text-white"
                )}
                style={
                  selectedInstructor === inst.id
                    ? { backgroundColor: inst.color || undefined }
                    : undefined
                }
              >
                <span
                  className="inline-block w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: inst.color || "#ccc" }}
                />
                {inst.name}
              </Button>
            ))}
        </div>
      )}

      <CalendarView
        instructorFilter={
          isAdmin ? selectedInstructor || undefined : session?.user?.id
        }
      />
    </div>
  );
}
