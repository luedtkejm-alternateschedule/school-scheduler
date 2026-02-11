"use client";
import { useEffect, useState } from "react";
type Block = { id:string; code:string; label:string; sort_index:number };
type Activity = { id:string; type:string; title:string; capacity:number; open_for_overflow:boolean; taken:number };
export default function Student(){
  const [me,setMe]=useState<any>(null);
  const [blocks,setBlocks]=useState<Block[]>([]);
  const [blockId,setBlockId]=useState("");
  const [acts,setActs]=useState<Activity[]>([]);
  const [msg,setMsg]=useState<string|null>(null);

  async function load(){
    const u=await fetch("/api/auth/me").then(r=>r.json());
    setMe(u.user);
    const b=await fetch("/api/admin/blocks").then(r=>r.json());
    setBlocks(b.blocks||[]);
    const first=(b.blocks||[])[0]?.id;
    if(first && !blockId) setBlockId(first);
  }
  async function loadActs(bid:string){
    const r=await fetch(`/api/student/activities?blockId=${encodeURIComponent(bid)}`);
    const j=await r.json();
    setActs(j.activities||[]);
  }
  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ if(blockId) loadActs(blockId); },[blockId]);

  async function join(activityId:string){
    setMsg(null);
    const r=await fetch("/api/student/signup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({blockId,activityId})});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||"Failed");return;}
    setMsg("Joined!");
    await loadActs(blockId);
  }
  async function logout(){ await fetch("/api/auth/logout",{method:"POST"}); location.href="/"; }

  if(me===null) return <main className="container"><p>Loading…</p></main>;
  if(!me) return <main className="container"><p>Please <a href="/login">login</a>.</p></main>;
  if(me.role!=="STUDENT") return <main className="container"><p>Not student. <a href="/login">Login</a></p></main>;

  return (
    <main className="container">
      <h1>Student</h1>
      <div className="card">
        <div className="row" style={{justifyContent:"space-between",alignItems:"center"}}>
          <span className="badge">{me.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </div>
      {msg && <div className="card"><b>{msg}</b></div>}
      <div className="card">
        <label>Block</label>
        <select value={blockId} onChange={e=>setBlockId(e.target.value)}>
          {blocks.map(b=>(<option key={b.id} value={b.id}>{b.code} — {b.label}</option>))}
        </select>
      </div>
      <div className="card">
        <h2>Activities (caps enforced)</h2>
        <table>
          <thead><tr><th>Type</th><th>Title</th><th>Seats</th><th></th></tr></thead>
          <tbody>
            {acts.map(a=>{
              const left=a.capacity-a.taken;
              return (
                <tr key={a.id}>
                  <td>{a.type}</td>
                  <td>{a.title} {a.open_for_overflow && <span className="badge">Overflow</span>}</td>
                  <td>{a.taken}/{a.capacity} ({left} left)</td>
                  <td><button disabled={left<=0} onClick={()=>join(a.id)}>{left<=0?"Full":"Join"}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p><small>Admin can run auto-assign for unassigned students.</small></p>
      </div>
    </main>
  );
}
