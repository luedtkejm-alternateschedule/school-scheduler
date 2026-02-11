import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

const Body = z.object({ blockId: z.string().uuid(), title: z.string().min(1), capacity: z.number().int().min(0).max(5000), openForOverflow: z.boolean() });

export async function POST(req: Request) {
  const auth = getAuth();
  if (!auth || auth.role !== "TEACHER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = Body.parse(await req.json());
  const sb = supabaseServer();

  const teacher = await sb.from("teachers").select("id").eq("user_id", auth.userId).single();
  if (teacher.error || !teacher.data) return NextResponse.json({ error: "Teacher not found. Import teachers first." }, { status: 400 });

  const existing = await sb.from("activities").select("id").eq("block_id", body.blockId).eq("leader_teacher_id", teacher.data.id).eq("type","ENRICHMENT").maybeSingle();
  if (existing.error) return NextResponse.json({ error: existing.error.message }, { status: 400 });

  const payload = { block_id: body.blockId, leader_teacher_id: teacher.data.id, type: "ENRICHMENT", title: body.title, capacity: body.capacity, open_for_overflow: body.openForOverflow, priority: 100 };

  const res = existing.data?.id
    ? await sb.from("activities").update(payload).eq("id", existing.data.id).select().single()
    : await sb.from("activities").insert(payload).select().single();

  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 400 });
  return NextResponse.json({ ok: true, activity: res.data });
}
