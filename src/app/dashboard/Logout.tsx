"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
export default function Logout(){const router=useRouter();const [error,setError]=useState("");return <><button className="logout" onClick={async()=>{try{const r=await fetch("/api/logout",{method:"POST"});if(!r.ok)throw Error();router.replace("/login");router.refresh()}catch{setError("Gagal keluar. Coba lagi.")}}}>Keluar →</button>{error&&<small role="alert">{error}</small>}</>}
