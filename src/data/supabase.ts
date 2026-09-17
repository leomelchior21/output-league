import { createClient } from '@supabase/supabase-js';
import type { Language } from './levels';

const PROJECT_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  || 'https://imodobxbarcsjylvitxt.supabase.co';
const PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim()
  || 'sb_publishable_jkHrLZkNR4Zh3XtHEgpTMA_JnMMpG6w';
const SESSION_KEY = 'output-league:student-session';

export const isSupabaseConfigured = (() => {
  try { return new URL(PROJECT_URL).protocol === 'https:' && !PROJECT_URL.includes('YOUR_PROJECT_REF'); }
  catch { return false; }
})();

const client = isSupabaseConfigured ? createClient(PROJECT_URL, PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
}) : null;

export interface StudentProfile {
  id: string;
  username: string;
  fullName: string;
  grade: 7 | 8 | 9;
  className: string;
  groupName: string | null;
  language: Language;
  isTeacher: boolean;
}

export interface StudentSession extends StudentProfile {
  token: string;
  expiresAt: string;
}

export interface StudentState {
  session: StudentSession;
  settings: Record<string, unknown> | null;
  progress: Partial<Record<Language, Record<number, { bestScore: number; stars: number; complete: boolean }>>>;
}

export interface LeaderboardEntry {
  language: Language;
  rank: number;
  displayName: string;
  totalScore: number;
  totalStars: number;
  levelsCompleted: number;
}

export interface TeacherStudentProgress {
  bestScore: number;
  stars: number;
  levelsCompleted: number;
}

export interface TeacherStudent {
  id: string;
  username: string;
  fullName: string;
  grade: 7 | 8 | 9;
  className: string;
  groupName: string | null;
  progress: Record<Language, TeacherStudentProgress>;
}

export class SupabaseSetupError extends Error {
  constructor(message = 'The Supabase project URL has not been configured yet.') { super(message); }
}

export function normalizeUsername(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function languageForGrade(grade: number): Language {
  if (grade === 7) return 'python';
  if (grade === 8) return 'swift';
  return 'csharp';
}

function parseStudent(raw: Record<string, unknown>): StudentProfile {
  const grade = Number(raw.grade) as 7 | 8 | 9;
  return {
    id: String(raw.id), username: String(raw.username), fullName: String(raw.full_name), grade,
    className: String(raw.class_name), groupName: raw.group_name ? String(raw.group_name) : null,
    language: languageForGrade(grade), isTeacher: raw.is_teacher === true,
  };
}

function parseState(raw: unknown): StudentState {
  if (!raw || typeof raw !== 'object') throw new Error('Supabase returned an invalid student session.');
  const value = raw as Record<string, unknown>;
  const student = parseStudent(value.student as Record<string, unknown>);
  const session: StudentSession = { ...student, token: String(value.token), expiresAt: String(value.expires_at) };
  const languageProgress = (value.progress && typeof value.progress === 'object' ? value.progress : {}) as Record<number, { best_score?: number; bestScore?: number; stars?: number; complete?: boolean }>;
  const progress = Object.fromEntries(Object.entries(languageProgress).map(([level, item]) => [level, {
    bestScore: Number(item.best_score ?? item.bestScore ?? 0), stars: Number(item.stars ?? 0), complete: item.complete === true,
  }]));
  return { session, settings: value.settings && typeof value.settings === 'object' ? value.settings as Record<string, unknown> : null, progress: { [student.language]: progress } };
}

function storeSession(session: StudentSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* The active React session remains usable without localStorage. */ }
}

export function getStudentSession(): StudentSession | null {
  try {
    const raw = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as StudentSession | null;
    if (!raw?.token || !raw.username || ![7, 8, 9].includes(raw.grade) || Date.parse(raw.expiresAt) <= Date.now()) {
      storeSession(null); return null;
    }
    return { ...raw, language: languageForGrade(raw.grade) };
  } catch { return null; }
}

export async function loginStudent(username: string, grade: 7 | 8 | 9) {
  if (!client) throw new SupabaseSetupError();
  const normalized = normalizeUsername(username);
  if (normalized.length < 3) throw new Error('Enter your first and last name together.');
  const { data, error } = await client.rpc('login_student', { p_username: normalized, p_grade: grade });
  if (error?.code === 'PGRST202') throw new SupabaseSetupError('Supabase is connected, but its database setup still needs to be run.');
  if (error) throw error;
  if (!data) throw new Error('We could not find that name in the selected grade. Check the spelling and try again.');
  const state = parseState(data);
  storeSession(state.session);
  return state;
}

export async function refreshStudentState() {
  const session = getStudentSession();
  if (!client || !session) return null;
  const { data, error } = await client.rpc('get_student_state', { p_session_token: session.token });
  if (error || !data) { if (error) console.warn('Could not refresh student progress.', error.message); return null; }
  const state = parseState(data);
  storeSession(state.session);
  return state;
}

export async function saveStudentSettingsRemote(settings: object) {
  const session = getStudentSession();
  if (!client || !session) return;
  const { error } = await client.rpc('save_student_settings', { p_session_token: session.token, p_settings: settings });
  if (error) console.warn('Could not sync garage settings.', error.message);
}

export async function saveStudentProgressRemote(language: Language, levelId: number, score: number, stars: number) {
  const session = getStudentSession();
  if (!client || !session) return;
  const { error } = await client.rpc('save_student_progress', { p_session_token: session.token, p_language: language, p_level_id: levelId, p_score: score, p_stars: stars });
  if (error) console.warn('Could not sync student progress.', error.message);
}

export async function getAllTimeLeaders(): Promise<Record<Language, LeaderboardEntry[]>> {
  const empty: Record<Language, LeaderboardEntry[]> = { python: [], swift: [], csharp: [] };
  if (!client) return empty;
  const { data, error } = await client.rpc('get_all_time_leaders');
  if (error) throw error;
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const language = String(row.language) as Language;
    if (!(language in empty)) continue;
    empty[language].push({
      language, rank: Number(row.rank), displayName: String(row.display_name), totalScore: Number(row.total_score),
      totalStars: Number(row.total_stars), levelsCompleted: Number(row.levels_completed),
    });
  }
  return empty;
}

export async function getTeacherDashboard(): Promise<TeacherStudent[]> {
  const session = getStudentSession();
  if (!client || !session) return [];
  const { data, error } = await client.rpc('get_teacher_dashboard', { p_session_token: session.token });
  if (error) throw error;
  if (!data) return [];
  const raw = (data as Record<string, unknown>).students;
  if (!Array.isArray(raw)) return [];
  return raw.map(entry => {
    const student = entry as Record<string, unknown>;
    const grade = Number(student.grade) as 7 | 8 | 9;
    const rawProgress = (student.progress && typeof student.progress === 'object' ? student.progress : {}) as Record<string, unknown>;
    const progress = Object.fromEntries((['python', 'swift', 'csharp'] as Language[]).map(language => {
      const value = (rawProgress[language] && typeof rawProgress[language] === 'object' ? rawProgress[language] : {}) as Record<string, unknown>;
      return [language, { bestScore: Number(value.best_score ?? 0), stars: Number(value.stars ?? 0), levelsCompleted: Number(value.levels_completed ?? 0) }];
    })) as Record<Language, TeacherStudentProgress>;
    return {
      id: String(student.id), username: String(student.username), fullName: String(student.full_name), grade,
      className: String(student.class_name), groupName: student.group_name ? String(student.group_name) : null, progress,
    };
  });
}

export async function logoutStudent() {
  const session = getStudentSession();
  storeSession(null);
  if (client && session) await client.rpc('logout_student', { p_session_token: session.token });
}
