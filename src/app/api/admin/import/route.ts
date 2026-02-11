import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getAuth } from "@/lib/auth";
import { supabaseServer } from "@/lib/supabaseServer";
import { parseCsvText } from "@/lib/csv";

const Body = z.object({ teachersCsvText: z.string().optional(), studentsCsvText: z.string().optional() });

export async function POST(req: Request) {
  const auth = getAuth();
  if (!auth || auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { teachersCsvText, studentsCsvText } = Body.parse(await req.json());
  const sb = supabaseServer();

  if (teachersCsvText) {
    const rows = parseCsvText(teachersCsvText);
    for (const r of rows) {
      const email = (r.email || "").toLowerCase().trim();
      const name = (r.name || "").trim();
      if (!email || !name) continue;
      const hash = await bcrypt.hash("teacher12345", 10);
      const user = await sb.from("app_users").upsert({ email, name, role: "TEACHER", password_hash: hash }, { onConflict: "email" }).select("id").single();
      if (!user.error && user.data?.id) await sb.from("teachers").upsert({ user_id: user.data.id }, { onConflict: "user_id" });
    }
  }

  if (studentsCsvText) {
    const rows = parseCsvText(studentsCsvText);
    for (const r of rows) {
      const email = (r.email || "").toLowerCase().trim();
      const name = (r.name || "").trim();
      const grade = parseInt(r.grade || "0", 10);
      const isSenior = String(r.isSenior || "").toLowerCase() === "true" || grade == 12;
      if (!email || !name || !grade) continue;
      const hash = await bcrypt.hash("student12345", 10);
      const user = await sb.from("app_users").upsert({ email, name, role: "STUDENT", password_hash: hash }, { onConflict: "email" }).select("id").single();
      if (!user.error && user.data?.id) await sb.from("students").upsert({ user_id: user.data.id, grade, is_senior: isSenior }, { onConflict: "user_id" });
    }
  }

  return NextResponse.json({ ok: true });
}
