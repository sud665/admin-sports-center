"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { NotificationBell } from "./notification-bell";

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end gap-1 border-b bg-background pl-14 pr-4 md:pl-6 md:pr-6">
      <NotificationBell />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2" aria-label={`${user?.name ?? "계정"} 메뉴`}>
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {user?.name?.[0] ?? "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm">
              {user?.name}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
