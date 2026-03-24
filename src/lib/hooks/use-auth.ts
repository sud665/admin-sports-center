"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "instructor" | "member";
  color?: string | null;
  memberId?: string | null; // For member role
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

export function useAuth(): AuthState & {
  signOut: () => Promise<void>;
} {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchUserProfile = useCallback(async (supabaseUser: User) => {
    try {
      // Fetch user profile from our DB via API
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const profile = await res.json();
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          name: profile.name ?? supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split("@")[0] ?? "사용자",
          role: profile.role ?? "admin",
          color: profile.color ?? null,
          memberId: profile.memberId ?? null,
        });
      } else {
        // User exists in Supabase Auth but not in our DB yet (or mock mode)
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split("@")[0] ?? "사용자",
          role: "admin",
          color: null,
        });
      }
    } catch {
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email ?? "",
        name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email?.split("@")[0] ?? "사용자",
        role: "admin",
        color: null,
      });
    }
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        await fetchUserProfile(supabaseUser);
      }
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          await fetchUserProfile(session.user);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    isAdmin: user?.role === "admin",
    isMember: user?.role === "member",
    signOut,
  };
}
