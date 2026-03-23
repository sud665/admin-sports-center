"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";

// next-auth SessionProvider types are incompatible with React 19 JSX element types
const AuthProvider = SessionProvider as React.ComponentType<{ children: React.ReactNode }>;

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}
