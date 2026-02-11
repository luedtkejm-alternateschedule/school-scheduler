import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";

const Body = z.object({ code: z.string().min(1), label: z.string().min(1), sort_index: z.number().int() });

export async function GET() {
  const sb = supabaseServer();
  const { data, error } = await sb.from("blocks").select("id,code,label,sort_index").order("sort_index");
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ blocks: data });
}

export async function POST(req: Request) {
  const auth = getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = Body.parse(await req.json());
  const sb = supabaseServer();
  const { error } = await sb.from("blocks").insert(body);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
