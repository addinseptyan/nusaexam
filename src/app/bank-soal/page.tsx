import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/layout/AdminShell";
import { PageHeader } from "@/components/shared/PageHeader";
import TestBankManager from "./TestBankManager";
export const dynamic = "force-dynamic";
export default async function Page(){
 if(!(await getCurrentUser()))redirect("/login");
 const [banks,items,tests,compositions]=await Promise.all([
  db.questionBank.findMany({include:{_count:{select:{items:true}}},orderBy:{createdAt:"asc"}}),
  db.testItem.findMany({orderBy:[{bankId:"asc"},{order:"asc"}]}),
  db.test.findMany({orderBy:{createdAt:"asc"}}),
  db.testBank.findMany({include:{bank:true},orderBy:{bank:{title:"asc"}}})
 ]);
 return <AdminShell><PageHeader breadcrumbs={["Beranda","Soal & tes"]} title="Bank soal & tes" description="Guru menyetor soal ke bank per mata pelajaran setiap tahun. Satu tes menyusun komposisinya dari beberapa bank; pelaksanaan mengambil soal sesuai komposisi itu."/><TestBankManager
  banks={banks.map(b=>({id:b.id,title:b.title,subject:b.subject,description:b.description||"",archived:!!b.archivedAt,itemCount:b._count.items}))}
  items={items.map(i=>({id:i.id,bankId:i.bankId,order:i.order,question:i.question,options:i.options,correctIndex:i.correctIndex}))}
  tests={tests.map(t=>({id:t.id,title:t.title,description:t.description||"",archived:!!t.archivedAt,createdAt:t.createdAt.toISOString()}))}
  compositions={compositions.map(c=>({id:c.id,testId:c.testId,bankId:c.bankId,bankTitle:c.bank.title,count:c.count}))}
 /></AdminShell>;
}
