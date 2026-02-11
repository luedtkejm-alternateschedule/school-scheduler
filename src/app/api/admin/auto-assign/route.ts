import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuth } from "@/lib/auth";
import { autoAssignUnassigned } from "@/lib/autoAssign";

const Body = z.object({ blockId: z.string().uuid() });

export async function POST(req: Request) {
  const auth = getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { blockId } = Body.parse(await req.json());
  const res = await autoAssignUnassigned(blockId);
  return NextResponse.json({ ok: true, placed: res.placed });
}
