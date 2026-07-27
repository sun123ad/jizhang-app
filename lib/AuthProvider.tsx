"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  ledgerId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  ledgerId: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const PUBLIC_PATHS = ["/login"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ledgerId, setLedgerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !session && !PUBLIC_PATHS.includes(pathname)) {
      router.replace("/login");
    }
    if (!loading && session && pathname === "/login") {
      router.replace("/");
    }
  }, [loading, session, pathname, router]);

  const loadLedgerId = useCallback(async () => {
    if (!session?.user) {
      setLedgerId(null);
      return;
    }
    const { data, error } = await supabase
      .from("ledger_members")
      .select("ledger_id")
      .eq("user_id", session.user.id)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Failed to load ledger membership:", error);
    }
    setLedgerId(data?.ledger_id ?? null);
  }, [session]);

  useEffect(() => {
    loadLedgerId();
  }, [loadLedgerId]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        ledgerId,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
