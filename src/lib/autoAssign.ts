import { supabaseServer } from "./supabaseServer";

export async function autoAssignUnassigned(blockId: string) {
  const sb = supabaseServer();

  const studentsRes = await sb.from("students").select("id");
  if (studentsRes.error) throw new Error(studentsRes.error.message);

  const signupsRes = await sb.from("student_signups").select("student_id").eq("block_id", blockId);
  if (signupsRes.error) throw new Error(signupsRes.error.message);

  const assigned = new Set(signupsRes.data.map(s => s.student_id));
  const unassigned = studentsRes.data.filter(s => !assigned.has(s.id));

  const otherSpaces = await sb.from("activities")
    .select("id,capacity,priority")
    .eq("block_id", blockId)
    .eq("type", "OTHER_SPACE")
    .order("priority", { ascending: true });

  if (otherSpaces.error) throw new Error(otherSpaces.error.message);

  const otherCounts = new Map<string, number>();
  for (const a of otherSpaces.data) {
    const c = await sb.from("student_signups").select("id", { count: "exact", head: true }).eq("activity_id", a.id);
    otherCounts.set(a.id, c.count ?? 0);
  }

  let placed = 0;

  for (const st of unassigned) {
    let done = false;

    // 1) Other Spaces first
    for (const a of otherSpaces.data) {
      const cur = otherCounts.get(a.id) ?? 0;
      if (cur < a.capacity) {
        const rpc = await sb.rpc("signup_student", { p_student_id: st.id, p_block_id: blockId, p_activity_id: a.id, p_source: "AUTO_OTHER_SPACE" });
        if (!rpc.error) {
          otherCounts.set(a.id, cur + 1);
          placed++;
          done = true;
          break;
        }
      }
    }
    if (done) continue;

    // 2) overflow enrichments
    const overflow = await sb.from("activities").select("id,capacity").eq("block_id", blockId).eq("type","ENRICHMENT").eq("open_for_overflow", true);
    if (overflow.error) throw new Error(overflow.error.message);

    let bestId: string | null = null;
    let bestCount = Number.POSITIVE_INFINITY;
    let bestCap = 0;

    for (const a of overflow.data) {
      const c = await sb.from("student_signups").select("id", { count: "exact", head: true }).eq("activity_id", a.id);
      const cnt = c.count ?? 0;
      if (cnt < a.capacity && cnt < bestCount) {
        bestId = a.id;
        bestCount = cnt;
        bestCap = a.capacity;
      }
    }

    if (!bestId) continue;
    const rpc = await sb.rpc("signup_student", { p_student_id: st.id, p_block_id: blockId, p_activity_id: bestId, p_source: "AUTO_OVERFLOW" });
    if (!rpc.error) placed++;
  }

  return { placed };
}
