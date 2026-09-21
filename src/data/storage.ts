import { paints, trails, decals, pitches } from './garage';
import type { Language } from './levels';
import { getStudentSession, saveStudentProgressRemote, saveStudentSettingsRemote } from './supabase';
export interface Settings { sound: boolean; reducedMotion: boolean; paint: typeof paints[number]['id']; trail: typeof trails[number]['id']; decal: typeof decals[number]; pitch: typeof pitches[number]['id'] }
export interface Progress { bestScore: number; stars: number; complete: boolean }
const defaults: Settings = { sound: true, reducedMotion: false, paint: 'azure', trail: 'ion', decal: 'crown', pitch: 'shuffle' };
const pendingKey = 'output-league:pending-progress';
interface PendingSave { language: Language; levelId: number; score: number; stars: number }
interface PendingQueue { owner: string; items: PendingSave[] }
const languages: Language[] = ['python', 'swift', 'csharp'];
function sessionOwner() {
  const session = getStudentSession();
  return session ? `${session.username}:${session.grade}` : null;
}
function cleanPending(raw: unknown): PendingQueue | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<PendingQueue>;
  if (typeof value.owner !== 'string' || !Array.isArray(value.items)) return null;
  const items = value.items.flatMap(item => {
    const entry = item as Partial<PendingSave> | null;
    if (!entry || typeof entry !== 'object') return [];
    const levelId = Number(entry.levelId);
    if (!languages.includes(entry.language as Language) || !Number.isInteger(levelId) || levelId < 1 || levelId > 8) return [];
    return [{ language: entry.language as Language, levelId, score: Math.max(0, Number(entry.score) || 0), stars: Math.max(0, Math.min(3, Number(entry.stars) || 0)) }];
  });
  return { owner: value.owner, items };
}
function readPending(): PendingQueue | null {
  try { return cleanPending(JSON.parse(localStorage.getItem(pendingKey) || 'null')); } catch { return null; }
}
function writePending(queue: PendingQueue | null) {
  try {
    if (queue?.items.length) localStorage.setItem(pendingKey, JSON.stringify(queue));
    else localStorage.removeItem(pendingKey);
  } catch { /* Optional persistence. */ }
}
export function queuePendingProgress(language: Language, levelId: number, score: number, stars: number) {
  const owner = sessionOwner();
  if (!owner) return;
  const queue = readPending();
  const items = queue?.owner === owner ? queue.items : [];
  const existing = items.find(item => item.language === language && item.levelId === levelId);
  if (existing) { existing.score = Math.max(existing.score, score); existing.stars = Math.max(existing.stars, stars); }
  else items.push({ language, levelId, score, stars });
  writePending({ owner, items: items.slice(-60) });
}
export async function flushPendingProgress(): Promise<boolean> {
  const owner = sessionOwner();
  const queue = readPending();
  if (!owner || !queue) return false;
  if (queue.owner !== owner) { writePending(null); return false; }
  const remaining: PendingSave[] = [];
  let synced = false;
  for (const item of queue.items) {
    const saved = await saveStudentProgressRemote(item.language, item.levelId, item.score, item.stars);
    if (saved) synced = true;
    else remaining.push(item);
  }
  writePending(remaining.length ? { owner, items: remaining } : null);
  return synced;
}
export function getSettings(): Settings {
  try { const s = JSON.parse(localStorage.getItem('output-league:settings') || '{}'); return { sound: typeof s.sound === 'boolean' ? s.sound : defaults.sound, reducedMotion: typeof s.reducedMotion === 'boolean' ? s.reducedMotion : matchMedia('(prefers-reduced-motion: reduce)').matches,
    paint: paints.some(p => p.id === s.paint) ? s.paint : defaults.paint,
    trail: trails.some(p => p.id === s.trail) ? s.trail : defaults.trail,
    decal: decals.includes(s.decal) ? s.decal : defaults.decal,
    pitch: pitches.some(p => p.id === s.pitch) ? s.pitch : defaults.pitch,
  }; } catch { return { ...defaults }; }
}
export function hasSeenTutorial() { try { return localStorage.getItem('output-league:tutorial') === '1'; } catch { return false; } }
export function rememberTutorial() { try { localStorage.setItem('output-league:tutorial', '1'); } catch { /* Optional persistence. */ } }
function cleanProgress(p: Partial<Progress> = {}): Progress {
  return { bestScore: Number.isFinite(p.bestScore) ? Math.max(0, Number(p.bestScore)) : 0, stars: Number.isInteger(p.stars) ? Math.max(0, Math.min(3, Number(p.stars))) : 0, complete: p.complete === true };
}
export function getProgress(levelId = 1, language: Language = 'python'): Progress {
  try {
    const key = language === 'python' ? 'output-league:level-progress' : `output-league:${language}:level-progress`;
    const levels = JSON.parse(localStorage.getItem(key) || '{}');
    if (levels[levelId]) return cleanProgress(levels[levelId]);
    if (language === 'python' && levelId === 1) return cleanProgress(JSON.parse(localStorage.getItem('output-league:progress') || '{}'));
    return cleanProgress();
  } catch { return cleanProgress(); }
}
export function saveSettings(s: Settings, sync = true) {
  try { localStorage.setItem('output-league:settings', JSON.stringify(s)); } catch { /* Play remains available without storage. */ }
  if (sync) void saveStudentSettingsRemote(s);
}
export function saveProgress(score: number, stars: number, levelId = 1, language: Language = 'python') {
  const old = getProgress(levelId, language), next = { bestScore: Math.max(old.bestScore, score), stars: Math.max(old.stars, stars), complete: true };
  try {
    const key = language === 'python' ? 'output-league:level-progress' : `output-league:${language}:level-progress`;
    const levels = JSON.parse(localStorage.getItem(key) || '{}');
    levels[levelId] = next;
    localStorage.setItem(key, JSON.stringify(levels));
    // Keep the original Level 1 record readable by existing installations and tests.
    if (language === 'python' && levelId === 1) localStorage.setItem('output-league:progress', JSON.stringify(next));
  } catch { /* Private browsing may disable storage. */ }
  if (!sessionOwner()) return;
  void saveStudentProgressRemote(language, levelId, score, stars).then(saved => { if (!saved) queuePendingProgress(language, levelId, score, stars); });
}

export function hydrateStudentStorage(settings: Partial<Settings> | null, progress: Partial<Record<Language, Record<number, Partial<Progress>>>>) {
  try {
    for (const language of ['python', 'csharp', 'swift'] as const) {
      const key = language === 'python' ? 'output-league:level-progress' : `output-league:${language}:level-progress`;
      const levels = progress[language] ?? {};
      const cleaned = Object.fromEntries(Object.entries(levels).map(([id, value]) => [id, cleanProgress(value)]));
      localStorage.setItem(key, JSON.stringify(cleaned));
      if (language === 'python') localStorage.setItem('output-league:progress', JSON.stringify(cleaned[1] ?? cleanProgress()));
    }
  } catch { /* The in-memory session still works if storage is unavailable. */ }
  if (settings) saveSettings({ ...defaults, ...settings }, false);
}

export function clearStudentStorage() {
  try {
    localStorage.removeItem('output-league:settings');
    localStorage.removeItem('output-league:progress');
    localStorage.removeItem('output-league:level-progress');
    localStorage.removeItem('output-league:csharp:level-progress');
    localStorage.removeItem('output-league:swift:level-progress');
    localStorage.removeItem(pendingKey);
  } catch { /* Optional local cache. */ }
}
