"use client";
import { useEffect, useState } from "react";

type Block = { id: string; code: string; label: string; sort_index: number; };
type Activity = { id: string; block_id: string; type: string; title: string; capacity: number; open_for_overflow: boolean; };

export default function Admin(){
  const [me,setMe]=useState<any>(null);
  const [blocks,setBlocks]=useState<Block[]>([]);
  const [activities,setActivities]=useState<Activity[]>([]);
  const [msg,setMsg]=useState<string|null>(null);

  const [code,setCode]=useState("2a");
  const [label,setLabel]=useState("Period 2a");
  const [sort,setSort]=useState(10);

  const [actBlock,setActBlock]=useState<string>("");
  const [actType,setActType]=useState("OTHER_SPACE");
  const [actTitle,setActTitle]=useState("Gym");
  const [actCap,setActCap]=useState(150);
  const [overflow,setOverflow]=useState(false);

  const [teachersCsv,setTeachersCsv]=useState("email,name\nteacher1@demo.local,Teacher 1");
  const [studentsCsv,setStudentsCsv]=useState("email,name,grade,isSenior\nstudent1@demo.local,Student 1,11,false");

  async function load(){
    const u=await fetch("/api/auth/me").then(r=>r.json());
    setMe(u.user);
    const b=await fetch("/api/admin/blocks").then(r=>r.json());
    setBlocks(b.blocks||[]);
    const a=await fetch("/api/admin/activities").then(r=>r.json());
    setActivities(a.activities||[]);
    if((b.blocks||[]).length && !actBlock) setActBlock((b.blocks||[])[0].id);
  }

  useEffect(()=>{ load(); },[]);

  async function logout(){ await fetch("/api/auth/logout",{method:"POST"}); location.href="/"; }

  async function addBlock(){
    setMsg(null);
    const r=await fetch("/api/admin/blocks",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({code,label,sort_index:Number(sort)})});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||"Failed");return;}
    setMsg("Block added."); await load();
  }

  async function addActivity(){
    setMsg(null);
    const r=await fetch("/api/admin/activities",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({blockId:actBlock,type:actType,title:actTitle,capacity:Number(actCap),openForOverflow:overflow})});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||"Failed");return;}
    setMsg("Activity added."); await load();
  }

  async function importRosters(){
    setMsg(null);
    const r=await fetch("/api/admin/import",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({teachersCsvText:teachersCsv,studentsCsvText:studentsCsv})});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||"Import failed");return;}
    setMsg("Imported. Teachers password=teacher12345, Students password=student12345");
  }

  async function autoAssign(blockId:string){
    setMsg(null);
    const r=await fetch("/api/admin/auto-assign",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({blockId})});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||"Auto-assign failed");return;}
    setMsg(`Auto-assigned ${j.placed} student(s) for that block.`);
    await load();
  }

  if(me===null) return <main className="container"><p>Loading…</p></main>;
  if(!me) return <main className="container"><p>Please <a href="/login">login</a>.</p></main>;
  if(me.role!=="ADMIN") return <main className="container"><p>Not admin. <a href="/login">Login</a></p></main>;

  return (
    <main className="container">
      <h1>Admin</h1>
      <div className="card">
        <div className="row" style={{justifyContent:"space-between",alignItems:"center"}}>
          <span className="badge">{me.email}</span>
          <button onClick={logout}>Log out</button>
        </div>
      </div>

      {msg && <div className="card"><b>{msg}</b></div>}

      <div className="card">
        <h2>1) Blocks</h2>
        <div className="row">
          <div style={{flex:"1 1 140px"}}><label>Code</label><input value={code} onChange={e=>setCode(e.target.value)} /></div>
          <div style={{flex:"2 1 280px"}}><label>Label</label><input value={label} onChange={e=>setLabel(e.target.value)} /></div>
          <div style={{flex:"1 1 120px"}}><label>Sort</label><input value={sort} onChange={e=>setSort(Number(e.target.value))} /></div>
          <div style={{alignSelf:"end"}}><button onClick={addBlock}>Add block</button></div>
        </div>
        <table>
          <thead><tr><th>Code</th><th>Label</th>
<th>Auto-assign</th></tr></thead>
          <tbody>
            {blocks.map(b=>(
              <tr key={b.id}>
                <td>{b.code}</td>
                <td>{b.label}</td>
                <td><button onClick={()=>autoAssign(b.id)}>Run</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>2) Activities</h2>
        <div className="row">
          <div style={{flex:"1 1 220px"}}>
            <label>Block</label>
            <select value={actBlock} onChange={e=>setActBlock(e.target.value)}>
              {blocks.map(b=>(<option key={b.id} value={b.id}>{b.code}</option>))}
            </select>
          </div>
          <div style={{flex:"1 1 220px"}}>
            <label>Type</label>
            <select value={actType} onChange={e=>setActType(e.target.value)}>
              <option value="OTHER_SPACE">Other Space</option>
              <option value="ENRICHMENT">Enrichment</option>
              <option value="OFFICE_HOURS">Office Hours</option>
              <option value="STUDY_HALL">Study Hall</option>
              <option value="COMMUNITY">Community</option>
            </select>
          </div>
          <div style={{flex:"2 1 240px"}}><label>Title</label><input value={actTitle} onChange={e=>setActTitle(e.target.value)} /></div>
          <div style={{flex:"1 1 120px"}}><label>Cap</label><input value={actCap} onChange={e=>setActCap(Number(e.target.value))} /></div>
        </div>
        <label style={{display:"flex",gap:8,alignItems:"center",marginTop:8}}>
          <input type="checkbox" checked={overflow} onChange={e=>setOverflow(e.target.checked)} style={{width:16}} />
          Open for overflow
        </label>
        <div style={{marginTop:12}}><button onClick={addActivity}>Add activity</button></div>

        <table>
          <thead><tr><th>Block</th><th>Type</th><th>Title</th><th>Cap</th><th>Overflow</th></tr></thead>
          <tbody>
            {activities.map(a=>(
              <tr key={a.id}>
                <td>{blocks.find(b=>b.id===a.block_id)?.code ?? "?"}</td>
                <td>{a.type}</td>
                <td>{a.title}</td>
                <td>{a.capacity}</td>
                <td>{a.open_for_overflow ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p><small>Other Spaces are used first for auto-assignment; then overflow enrichments.</small></p>
      </div>

      <div className="card">
        <h2>3) Import Teachers & Students (CSV paste)</h2>
        <div className="row">
          <div style={{flex:"1 1 400px"}}>
            <label>Teachers CSV (email,name)</label>
            <textarea rows={6} value={teachersCsv} onChange={e=>setTeachersCsv(e.target.value)} />
          </div>
          <div style={{flex:"1 1 400px"}}>
            <label>Students CSV (email,name,grade,isSenior)</label>
            <textarea rows={6} value={studentsCsv} onChange={e=>setStudentsCsv(e.target.value)} />
          </div>
        </div>
        <button onClick={importRosters}>Import</button>
        <p><small>Teacher password: teacher12345 — Student password: student12345</small></p>
      </div>

      <div className="card">
        <h2>Try the other roles</h2>
        <ul>
          <li><a href="/teacher">Teacher page</a></li>
          <li><a href="/student">Student page</a></li>
        </ul>
      </div>
    </main>
  );
}
