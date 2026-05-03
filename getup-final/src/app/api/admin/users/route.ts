import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ok, fail, handleError } from "@/lib/http";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() || "";
    const sb = supabaseAdmin();

    let query = sb
      .from("users")
      .select(
        "id,email,first_name,last_name,role,blocked,blocked_reason,iban,balance_checking,balance_savings,created_at"
      )
      .neq("role", "admin")
      .order("created_at", { ascending: false })
      .limit(500);

    if (q) {
      query = query.or(`email.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
    }

    const { data, error } = await query;
    if (error) return fail(500, error.message);
    return ok({ users: data || [] });
  } catch (e) {
    return handleError(e);
  }
}
