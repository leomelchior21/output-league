import { paints, trails, decals, pitches } from './garage';
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
export function getProgress(): Progress {
  try { const p = JSON.parse(localStorage.getItem('output-league:progress') || '{}'); return { bestScore: Number.isFinite(p.bestScore) ? Math.max(0, p.bestScore) : 0, stars: Number.isInteger(p.stars) ? Math.max(0, Math.min(3, p.stars)) : 0, complete: p.complete === true }; } catch { return { bestScore: 0, stars: 0, complete: false }; }
}
export function saveSettings(s: Settings) { try { localStorage.setItem('output-league:settings', JSON.stringify(s)); } catch { /* Play remains available without storage. */ } }
export function saveProgress(score: number, stars: number) { const old = getProgress(); try { localStorage.setItem('output-league:progress', JSON.stringify({ bestScore: Math.max(old.bestScore, score), stars: Math.max(old.stars, stars), complete: true })); } catch { /* Private browsing may disable storage. */ } }
