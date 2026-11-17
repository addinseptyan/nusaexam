"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogInIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { useApi } from "@/components/shared/useApi";
export default function LoginSiswa(){
 const {request}=useApi(); const router=useRouter();
 const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent){
  e.preventDefault(); if(busy)return; setBusy(true);
  const res=await request("/api/exam/login","POST",{username,password});
  setBusy(false);
  if(res){router.push("/ujian");router.refresh()}
 }
 return <form className="grid gap-4" onSubmit={submit}>
  <Field label="Username peserta"><Input required maxLength={50} autoComplete="username" placeholder="mis. p2601-0001" value={username} onChange={e=>setUsername(e.target.value)}/></Field>
  <Field label="Password periode ini"><Input required type="password" maxLength={256} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)}/></Field>
  <Button type="submit" disabled={busy} className="w-full">{busy?"Memeriksa…":<><LogInIcon size={15}/> Masuk ujian</>}</Button>
 </form>;
}
