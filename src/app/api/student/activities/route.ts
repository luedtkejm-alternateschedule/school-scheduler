import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const blockId = searchParams.get("blockId");
  if (!blockId) return NextResponse.json({ error: "blockId required" }, { status: 400 });

  const sb = supabaseServer();
  const actsRes = await sb.from("activities").select("id,type,title,capacity,open_for_overflow").eq("block_id", blockId).order("type");
  if (actsRes.error) return NextResponse.json({ error: actsRes.error.message }, { status: 400 });

  const out: any[] = [];
  for (const a of actsRes.data) {
    const c = await sb.from("student_signups").select("id", { count: "exact", head: true }).eq("activity_id", a.id);
    out.push({ ...a, taken: c.count ?? 0 });
  }
  return NextResponse.json({ activities: out });
}
