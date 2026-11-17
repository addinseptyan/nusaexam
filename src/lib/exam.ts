import { db } from "./db";
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export async function drawItems(executionId: string) {
  const exec = await db.testExecution.findUnique({ where: { id: executionId } });
  if (!exec) return null;
  const testBanks = await db.testBank.findMany({ where: { testId: exec.testId }, include: { bank: { include: { items: { orderBy: { order: "asc" } } } } } });
  const snaps: { question: string; options: string[]; correctIndex: number }[] = [];
  for (const tb of testBanks) {
    let items = tb.bank.items;
    if (exec.shuffleQuestions) items = shuffle(items);
    for (const it of items.slice(0, tb.count)) {
      let options = [...it.options]; let correct = it.correctIndex;
      if (exec.shuffleOptions) { const perm = shuffle(options.map((_, i) => i)); options = perm.map(i => options[i]); correct = perm.indexOf(correct); }
      snaps.push({ question: it.question, options, correctIndex: correct });
    }
  }
  return { snaps, exec };
}
export function scoreOf(items: { correctIndex: number; answer: number | null }[]) {
  if (!items.length) return 0;
  const c = items.filter(i => i.answer === i.correctIndex).length;
  return Math.round((c / items.length) * 100);
}
export async function finalizeAttempt(id: string) {
  const a = await db.examAttempt.findUnique({ where: { id }, include: { items: true } });
  if (!a || a.status === "SELESAI") return a;
  return db.examAttempt.update({ where: { id }, data: { status: "SELESAI", finishedAt: new Date(), score: scoreOf(a.items) }, include: { items: true } });
}
export async function finalizeIfExpired<T extends { id: string; status: string; endsAt: Date }>(attempt: T) {
  if (attempt.status !== "MULAI" || new Date() <= attempt.endsAt) return attempt;
  return finalizeAttempt(attempt.id);
}
export function attemptPayload(a: { id: string; status: string; startedAt: Date; endsAt: Date; finishedAt: Date | null; score: number | null; items: { id: string; order: number; question: string; options: string[]; answer: number | null }[] }, meta: { testTitle: string; kind: string; roomLabel: string; shuffleQuestions: boolean }) {
  return {
    id: a.id, status: a.status, startedAt: a.startedAt, endsAt: a.endsAt, finishedAt: a.finishedAt, score: a.score,
    serverNow: new Date().toISOString(), ...meta,
    items: [...a.items].sort((x, y) => x.order - y.order).map(({ id, order, question, options, answer }) => ({ id, order, question, options, answer }))
  };
}
