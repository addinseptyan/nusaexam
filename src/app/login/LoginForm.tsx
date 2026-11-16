"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
export default function LoginForm({color}:{color:string}) {
 const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");const f=new FormData(e.currentTarget);try{const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:f.get("username"),password:f.get("password")})});const j=await r.json();if(!r.ok){setError(j.error || "Gagal masuk.");return}router.replace("/dashboard");router.refresh()}catch{setError("Tidak dapat menghubungi server.")}finally{setBusy(false)}}
 return <form onSubmit={submit} className="form"><label>Username<input name="username" autoComplete="username" required maxLength={50}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required maxLength={256}/></label>{error&&<div role="alert" className="error">{error}</div>}<button className="button" style={{background:color}} disabled={busy}>{busy?"Memproses…":"Masuk ke dashboard →"}</button></form>
}
