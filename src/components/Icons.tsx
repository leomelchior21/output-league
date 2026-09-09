import { Box, Calculator, Crown, Database, GitBranch, Keyboard, Repeat2, Terminal } from 'lucide-react';
import type { Language, LevelIcon } from '../data/levels';

export function PythonIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M31.6 5C17 5 18 11.3 18 11.3V18h14v2H12S4 19 4 32s7 13 7 13h7v-9s-.4-7 7-7h14s7 .1 7-7V12s1-7-14.4-7Z" fill="#3EA8ED"/><path d="M32.4 59C47 59 46 52.7 46 52.7V46H32v-2h20s8 1 8-12-7-13-7-13h-7v9s.4 7-7 7H25s-7-.1-7 7v10s-1 7 14.4 7Z" fill="#FFD05A"/><circle cx="25" cy="12" r="2.3" fill="#082748"/><circle cx="39" cy="52" r="2.3" fill="#71521F"/></svg>;
}

export function CSharpIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="m32 4 24 14v28L32 60 8 46V18Z" fill="#6d42b8" stroke="#c5a4ff" strokeWidth="2"/><path d="M36 21a13 13 0 1 0 0 22" stroke="#fff" strokeWidth="6" strokeLinecap="round"/><path d="M42 23v18M50 23v18M39 29h15M39 36h15" stroke="#eadfff" strokeWidth="3" strokeLinecap="round"/></svg>;
}

export function SwiftIcon({ className = '' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M9 8h46a5 5 0 0 1 5 5v38a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5Z" fill="url(#swiftGradient)"/><path d="M14 17c10 9 17 13 26 17-6 2-14 1-23-4 8 10 18 16 29 15 5 0 8-2 10-5-2-7-7-15-14-22 3 6 4 11 3 15-8-7-17-12-31-16Z" fill="#fff"/><defs><linearGradient id="swiftGradient" x1="9" y1="7" x2="55" y2="57"><stop stopColor="#ffb45d"/><stop offset="1" stopColor="#f2523c"/></linearGradient></defs></svg>;
}

export function LanguageIcon({ language, className = '' }: { language: Language; className?: string }) {
  if (language === 'csharp') return <CSharpIcon className={className} />;
  if (language === 'swift') return <SwiftIcon className={className} />;
  return <PythonIcon className={className} />;
}

function CSharpConcept({ name, size }: { name: LevelIcon; size: number }) {
  const common = { width: size, height: size, viewBox: '0 0 64 64', fill: 'none', 'aria-hidden': true } as const;
  if (name === 'terminal') return <svg {...common}><rect x="7" y="10" width="50" height="42" rx="7" stroke="currentColor" strokeWidth="3"/><path d="m15 23 7 6-7 6M29 38h18M40 19h8M40 26h8M44 15v15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'box') return <svg {...common}><rect x="6" y="11" width="23" height="42" rx="5" stroke="currentColor" strokeWidth="3"/><rect x="35" y="11" width="23" height="42" rx="5" stroke="currentColor" strokeWidth="3"/><path d="M12 21h11M12 31h11M39 22h15M39 31h15M43 39h7" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><circle cx="17" cy="43" r="3" fill="currentColor"/></svg>;
  if (name === 'database') return <svg {...common}><rect x="5" y="13" width="20" height="18" rx="4" stroke="currentColor" strokeWidth="3"/><rect x="39" y="34" width="20" height="18" rx="4" stroke="currentColor" strokeWidth="3"/><path d="M25 22h19l-5-5m5 5-5 5M39 43H20l5-5m-5 5 5 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'calculator') return <svg {...common}><path d="M12 8h40a4 4 0 0 1 4 4v40a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="3"/><rect x="23" y="23" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="3"/><path d="M14 18h9m-4-5v10M43 18h9M15 46l7 7m0-7-7 7M44 46h9m-9 7h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
  const Future = { keyboard: Keyboard, split: GitBranch, repeat: Repeat2, crown: Crown }[name as 'keyboard' | 'split' | 'repeat' | 'crown'];
  return <Future size={size} strokeWidth={1.8} aria-hidden="true" />;
}

function SwiftConcept({ name, size }: { name: LevelIcon; size: number }) {
  const common = { width: size, height: size, viewBox: '0 0 64 64', fill: 'none', 'aria-hidden': true } as const;
  if (name === 'terminal') return <svg {...common}><path d="M11 13h38l7 7v31H11Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><path d="M18 37h27M18 44h19M18 28c8-1 14-4 20-10-3 8-1 12 6 16-10-1-18-3-26-6Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'box') return <svg {...common}><path d="m32 7 23 13v27L32 58 9 47V20Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/><path d="m9 20 23 13 23-13M32 33v25" stroke="currentColor" strokeWidth="3"/><circle cx="32" cy="20" r="6" stroke="currentColor" strokeWidth="3"/></svg>;
  if (name === 'database') return <svg {...common}><circle cx="14" cy="17" r="7" stroke="currentColor" strokeWidth="3"/><circle cx="50" cy="47" r="7" stroke="currentColor" strokeWidth="3"/><circle cx="14" cy="47" r="7" stroke="currentColor" strokeWidth="3"/><path d="M21 17h20l-5-5m5 5-5 5M21 43l20-19M21 47h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'calculator') return <svg {...common}><circle cx="32" cy="32" r="25" stroke="currentColor" strokeWidth="3"/><path d="M32 15v34M15 32h34M20 21l8 8m0-8-8 8M38 38h9m-9 8h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>;
  const Future = { keyboard: Keyboard, split: GitBranch, repeat: Repeat2, crown: Crown }[name as 'keyboard' | 'split' | 'repeat' | 'crown'];
  return <Future size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export function ConceptIcon({ name, language = 'python', size = 28 }: { name: LevelIcon; language?: Language; size?: number }) {
  if (language === 'csharp') return <CSharpConcept name={name} size={size} />;
  if (language === 'swift') return <SwiftConcept name={name} size={size} />;
  const PythonConcept = { terminal: Terminal, box: Box, database: Database, calculator: Calculator, keyboard: Keyboard, split: GitBranch, repeat: Repeat2, crown: Crown }[name];
  return <PythonConcept size={size} strokeWidth={1.65} aria-hidden="true" />;
}
