"use client";
import { useState } from "react";

export default function Login(){
  const[email,setEmail]=useState("admin@demo.local");
  const[password,setPassword]=useState("admin12345");
  const[msg,setMsg]=useState<string|null>(null);

  async function submit(){
    setMsg(null);
    const r=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
    const j=await r.json();
    if(!r.ok){setMsg(j.error||"Login failed");return;}
    if(j.role==="ADMIN") location.href="/admin";
    else if(j.role==="TEACHER") location.href="/teacher";
    else location.href="/student";
  }

  return (
    <main className="container">
      <h1>Login</h1>
      <div className="card">
        <div className="row">
          <div style={{flex:"1 1 320px"}}>
            <label>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div style={{flex:"1 1 320px"}}>
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
        </div>
        <div style={{marginTop:12}}>
          <button onClick={submit}>Sign in</button>
          <span style={{marginLeft:12}}><a href="/">Home</a></span>
        </div>
        {msg && <p style={{color:"#b91c1c"}}>{msg}</p>}
        <p><small>Admin: admin@demo.local / admin12345</small></p>
      </div>
    </main>
  );
}
