import { paints, trails, decals, pitches } from './garage';
import type { Language } from './levels';
export interface Settings { sound: boolean; reducedMotion: boolean; paint: typeof paints[number]['id']; trail: typeof trails[number]['id']; decal: typeof decals[number]; pitch: typeof pitches[number]['id'] }
export interface Progress { bestScore: number; stars: number; complete: boolean }
const defaults: Settings = { sound: true, reducedMotion: false, paint: 'azure', trail: 'ion', decal: 'crown', pitch: 'shuffle' };
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
export function saveSettings(s: Settings) { try { localStorage.setItem('output-league:settings', JSON.stringify(s)); } catch { /* Play remains available without storage. */ } }
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
}
