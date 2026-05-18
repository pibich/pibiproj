import { cache } from "react";
import { createClient } from "./supabase/server";
import type { Profile } from "@/types/supabase";

export const getUser = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
});

export const requireUser = cache(async (): Promise<Profile> => {
  const profile = await getUser();
  if (!profile) {
    throw new Error("UNAUTHORIZED");
  }
  return profile;
});

export const requireAdmin = cache(async (): Promise<Profile> => {
  const profile = await requireUser();
  if (profile.role !== "admin") {
    throw new Error("FORBIDDEN");
  }
  return profile;
});

