import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

const Body = z.object({
  blockId: z.string().uuid(),
  type: z.enum(["ENRICHMENT","OFFICE_HOURS","STUDY_HALL","OTHER_SPACE","COMMUNITY"]),
  title: z.string().min(1),
  capacity: z.number().int().min(0).max(5000),
  openForOverflow: z.boolean().default(false)
});

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("activities").select("id,block_id,type,title,capacity,open_for_overflow,priority").order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ activities: data });
}

export async function POST(req: Request) {
  const auth = getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = Body.parse(await req.json());
  const sb = supabaseServer();
  const { error } = await sb.from("activities").insert({
    block_id: body.blockId,
    leader_teacher_id: null,
    type: body.type,
    title: body.title,
    capacity: body.capacity,
    open_for_overflow: body.openForOverflow,
    priority: body.type === "OTHER_SPACE" ? 10 : 100
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
