"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
export default function LoginForm(){
 const router=useRouter();
 const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false); const [error,setError]=useState("");
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});const j=await r.json().catch(()=>({}));if(!r.ok){setError(j.error||"Username atau password salah.");return}router.replace("/dashboard");router.refresh()}catch{setError("Tidak dapat menghubungi server.")}finally{setBusy(false)}}
 return <form className="mt-5 grid gap-3.5" onSubmit={submit}>
  <Field label="Username"><Input value={username} onChange={e=>setUsername(e.target.value)} required autoComplete="username" maxLength={60}/></Field>
  <Field label="Password"><Input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password" maxLength={120}/></Field>
  {error&&<p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>}
  <Button type="submit" disabled={busy} className="mt-1 w-full">{busy?"Memeriksa…":<><LogInIcon size={16}/> Masuk</>}</Button>
 </form>;
}
