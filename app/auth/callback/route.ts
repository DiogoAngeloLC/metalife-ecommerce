import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Se veio com next explícito, respeitar
  const nextParam = searchParams.get("next");
  if (nextParam) {
    return NextResponse.redirect(`${origin}${nextParam}`);
  }

  // Default: admin → /admin, vendor → /dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: admin } = await supabase
      .from("app_admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    return NextResponse.redirect(`${origin}${admin ? "/admin" : "/dashboard"}`);
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
