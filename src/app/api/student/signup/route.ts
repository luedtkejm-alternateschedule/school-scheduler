import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

const Body = z.object({ blockId: z.string().uuid(), activityId: z.string().uuid() });

export async function POST(req: Request) {
  const auth = getAuth();
  if (!auth || auth.role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { blockId, activityId } = Body.parse(await req.json());
  const sb = supabaseServer();

  const student = await sb.from("students").select("id").eq("user_id", auth.userId).single();
  if (student.error || !student.data) return NextResponse.json({ error: "Student not found. Import students first." }, { status: 400 });

  const rpc = await sb.rpc("signup_student", { p_student_id: student.data.id, p_block_id: blockId, p_activity_id: activityId, p_source: "SELF" });
  if (rpc.error) return NextResponse.json({ error: rpc.error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
