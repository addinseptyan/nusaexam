// Load test sederhana alur siswa: login -> mulai attempt -> autosave tiap soal -> selesai.
// Pakai: node scripts/loadtest.mjs http://localhost:3000 p2601-0001,p2601-0002,... password [konkurensi]
const [,, base = "http://localhost:3000", userArg = "", password = "demo12345", concArg = "10"] = process.argv;
const users = userArg.split(",").map(s => s.trim()).filter(Boolean);
if (!users.length) { console.log("Contoh: node scripts/loadtest.mjs http://localhost:3000 p2601-0001,p2601-0002 demo12345 10"); process.exit(1); }
const CONC = Math.max(1, Number(concArg) || 10);
const latencies = []; const errors = [];
const jar = c => ({ cookie: c });
async function login(u) {
 const r = await fetch(`${base}/api/exam/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password }) });
 if (!r.ok) throw new Error(`${u}: login ${r.status}`);
 const cookie = (r.headers.getSetCookie?.() ?? []).map(c => c.split(";")[0]).join("; ");
 return jar(cookie);
}
const get = (url, j) => fetch(url, { headers: { Cookie: j.cookie } }).then(r => { if (!r.ok) throw new Error(`${url} -> ${r.status}`); return r.json(); });
const post = (url, j, body, measure = false) => { const t0 = measure ? Date.now() : 0; return fetch(url, { method: "POST", headers: { "Content-Type": "application/json", Cookie: j.cookie }, body: JSON.stringify(body) }).then(async r => { if (!r.ok) throw new Error(`${url} -> ${r.status}`); if (measure) latencies.push(Date.now() - t0); return r.json(); }); };
async function run(u) {
 const j = await login(u);
 const tests = await get(`${base}/api/exam/tests`, j);
 const active = (tests.rows ?? []).find(r => r.state === "AKTIF");
 if (!active) { errors.push(`${u}: tidak ada ujian aktif`); return; }
 const st = await post(`${base}/api/exam/attempts`, j, { executionId: active.executionId });
 const attempt = st.attempt;
 await get(`${base}/api/exam/attempts/${attempt.id}`, j);
 for (const it of attempt.items) await post(`${base}/api/exam/attempts/${attempt.id}/answers`, j, { itemId: it.id, selectedIndex: Math.floor(Math.random() * it.options.length) }, true);
 await post(`${base}/api/exam/attempts/${attempt.id}/finish`, j, {});
}
(async () => {
 const t0 = Date.now();
 for (let i = 0; i < users.length; i += CONC) await Promise.allSettled(users.slice(i, i + CONC).map(u => run(u).catch(e => { errors.push(String(e.message ?? e)); })));
 const wall = Date.now() - t0;
 const sorted = [...latencies].sort((a, b) => a - b);
 const q = p => sorted[Math.floor(p * (sorted.length - 1))] ?? 0;
 console.log(`Peserta: ${users.length} · konkurensi: ${CONC} · dinding: ${(wall / 1000).toFixed(1)} dtk`);
 console.log(`Autosave: n=${sorted.length} p50=${q(0.5)}ms p95=${q(0.95)}ms maks=${sorted.at(-1) ?? 0}ms`);
 console.log(errors.length ? `Galat (${errors.length}): ${errors.slice(0, 5).join(" | ")}` : "Tanpa galat.");
})();
