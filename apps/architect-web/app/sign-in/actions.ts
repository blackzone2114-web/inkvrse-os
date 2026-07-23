"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function credentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(formData: FormData) {
  const { email, password } = credentials(formData);

  if (!email || !password) {
    redirect("/sign-in?error=Email%20and%20password%20are%20required");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/sign-in?error=Supabase%20is%20not%20configured");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);

  redirect("/");
}

export async function signUp(formData: FormData) {
  const { email, password } = credentials(formData);

  if (!email || !password) {
    redirect("/sign-in?error=Email%20and%20password%20are%20required");
  }
  if (password.length < 8) {
    redirect("/sign-in?error=Password%20must%20be%20at%20least%208%20characters");
  }

  const supabase = await createClient();
  if (!supabase) redirect("/sign-in?error=Supabase%20is%20not%20configured");

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);

  if (!data.session) {
    redirect("/sign-in?message=Account%20created.%20Check%20your%20email%20to%20confirm%20access%2C%20then%20sign%20in.");
  }

  redirect("/");
}
