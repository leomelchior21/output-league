import { Box, Calculator, Crown, Database, GitBranch, Keyboard, Repeat2, Terminal } from 'lucide-react';
import type { LevelIcon } from '../data/levels';
export function PythonIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M31.6 5C17 5 18 11.3 18 11.3V18h14v2H12S4 19 4 32s7 13 7 13h7v-9s-.4-7 7-7h14s7 .1 7-7V12s1-7-14.4-7Z" fill="#3EA8ED"/><path d="M32.4 59C47 59 46 52.7 46 52.7V46H32v-2h20s8 1 8-12-7-13-7-13h-7v9s.4 7-7 7H25s-7-.1-7 7v10s-1 7 14.4 7Z" fill="#FFD05A"/><circle cx="25" cy="12" r="2.3" fill="#082748"/><circle cx="39" cy="52" r="2.3" fill="#71521F"/></svg>;
}
export function ConceptIcon({ name, size = 28 }: { name: LevelIcon; size?: number }) {
  const Icon = { terminal: Terminal, box: Box, database: Database, calculator: Calculator, keyboard: Keyboard, split: GitBranch, repeat: Repeat2, crown: Crown }[name];
  return <Icon size={size} strokeWidth={1.65} aria-hidden="true" />;
}
