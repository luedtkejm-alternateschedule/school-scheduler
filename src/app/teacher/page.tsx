"use client";
import { useEffect, useState } from "react";
type Block = { id:string; code:string; label:string; sort_index:number };
export default function Teacher(){
  const [me,setMe]=useState<any>(null);
  const [blocks,setBlocks]=useState<Block[]>([]);
  const [blockId,setBlockId]=useState("");
  const [title,setTitle]=useState("My Enrichment");
  const [capacity,setCapacity]=useState(12);
  const [overflow,setOverflow]=useState(false);
  const [msg,setMsg]=useState<string|null>(null);

  async function load(){
    const u=await fetch("/api/auth/me").then(r=>r.json());
    setMe(u.user);
    const b=await fetch("/api/admin/blocks").then(r=>r.json());
    setBlocks(b.blocks||[]);
    if((b.blocks||[]).length && !blockId) setBlockId((b.blocks||[])[0].id);
  }
  useEffect(()=>{ load(); },[]);

  async function save(){
    setMsg(null);
    const r=await fetch("/api/teacher/enrichment",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({blockId,title,capacity:Number(capacity),openForOverflow:overflow})});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||"Failed");return;}
    setMsg("Saved!");
  }
  async function logout(){ await fetch("/api/auth/logout",{method:"POST"}); location.href="/"; }

  if(me===null) return <main className="container"><p>Loading…</p></main>;
  if(!me) return <main className="container"><p>Please <a href="/login">login</a>.</p></main>;
  if(me.role!=="TEACHER") return <main className="container"><p>Not teacher. <a href="/login">Login</a></p></main>;

  return (
    <main className="container">
      <h1>Teacher</h1>
      <div className="card">
        <div className="row" style={{justifyContent:"space-between",alignItems:"center"}}>
          <span className="badge">{me.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </div>
      {msg && <div className="card"><b>{msg}</b></div>}
      <div className="card">
        <h2>Create / Update Enrichment</h2>
        <div className="row">
          <div style={{flex:"1 1 220px"}}>
            <label>Block</label>
            <select value={blockId} onChange={e=>setBlockId(e.target.value)}>
              {blocks.map(b=>(<option key={b.id} value={b.id}>{b.code}</option>))}
            </select>
          </div>
          <div style={{flex:"2 1 320px"}}><label>Title</label><input value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div style={{flex:"1 1 120px"}}><label>Capacity</label><input value={capacity} onChange={e=>setCapacity(Number(e.target.value))} /></div>
        </div>
        <label style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
          <input type="checkbox" checked={overflow} onChange={e=>setOverflow(e.target.checked)} style={{width:16}} />
          Open for overflow
        </label>
        <div style={{marginTop:12}}><button onClick={save}>Save enrichment</button> <span style={{marginLeft:12}}><a href="/admin">Admin</a></span></div>
      </div>
    </main>
  );
}
