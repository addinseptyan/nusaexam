export type StudentFields={name:string;nis:string|null;nisKey:string|null;nisn:string|null};
export function parseStudentFields(raw:{name?:unknown;nis?:unknown;nisn?:unknown}):StudentFields|null{
 const name=typeof raw.name==="string"?raw.name.trim().replace(/\s+/g," "):"";
 const nis=typeof raw.nis==="string"?raw.nis.trim():"";
 const nisn=typeof raw.nisn==="string"?raw.nisn.trim():"";
 if(!name||name.length>120)return null;
 if(nis.length>32||/[\u0000-\u001f\u007f]/.test(nis))return null;
 if(nisn&&!/^\d{10}$/.test(nisn))return null;
 return {name,nis:nis||null,nisKey:nis?nis.normalize("NFKC").toUpperCase():null,nisn:nisn||null};
}
