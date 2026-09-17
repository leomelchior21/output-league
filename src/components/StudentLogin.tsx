import { ArrowRight, Check, LayoutDashboard, LogIn, LogOut, UserRound } from 'lucide-react';
import { languages, type Language } from '../data/levels';
import { languageForGrade, normalizeUsername, type StudentSession } from '../data/supabase';
import { LanguageIcon } from './Icons';

const grades = [
  { grade: 7 as const, language: 'python' as const, label: '7TH GRADE' },
  { grade: 8 as const, language: 'swift' as const, label: '8TH GRADE' },
  { grade: 9 as const, language: 'csharp' as const, label: '9TH GRADE' },
];

export default function StudentLogin({ grade, username, pending, error, session, onGrade, onUsername, onLogin, onContinue, onLogout, onDashboard }: {
  grade: 7 | 8 | 9;
  username: string;
  pending: boolean;
  error: string;
  session: StudentSession | null;
  onGrade: (grade: 7 | 8 | 9, language: Language) => void;
  onUsername: (value: string) => void;
  onLogin: () => void;
  onContinue: () => void;
  onLogout: () => void;
  onDashboard: () => void;
}) {
  if (session) return <section className="student-login returning-player" aria-label="Student login">
    <div className="returning-avatar"><UserRound /></div>
    <div className="returning-copy"><span className="eyebrow">{session.isTeacher ? 'STAFF SIGNED IN' : 'WELCOME BACK'}</span><strong>{session.fullName}</strong><small>{session.isTeacher ? 'All languages · all students' : `${session.className} · ${languages[session.language].displayName}`}</small></div>
    <button className="primary-button continue-button" onClick={onContinue}>CONTINUE <ArrowRight size={20} /></button>
    {session.isTeacher && <button className="teacher-dashboard-open" onClick={onDashboard}><LayoutDashboard size={16} /> TEACH DASHBOARD</button>}
    <button className="switch-player" onClick={onLogout}><LogOut size={14} /> NOT YOU?</button>
  </section>;

  const selectedLanguage = languageForGrade(grade);
  const normalized = normalizeUsername(username);
  return <section className="student-login" aria-label="Student login">
    <div className="login-heading"><span className="eyebrow">CHOOSE YOUR CLASS</span><h1>Enter your journey.</h1></div>
    <div className="language-cards grade-cards">
      {grades.map(option => <button key={option.grade} type="button" className={`language-card ${option.language}-card ${grade === option.grade ? 'selected' : ''}`} aria-pressed={grade === option.grade} aria-label={`${option.label} · ${languages[option.language].displayName}`} onClick={() => onGrade(option.grade, option.language)}>
        <span className="selected-check"><Check size={12} strokeWidth={3} /></span><LanguageIcon language={option.language} /><strong>{option.label}</strong><span className="card-caption">{languages[option.language].displayName.toUpperCase()}</span>
      </button>)}
    </div>
    <form onSubmit={event => { event.preventDefault(); onLogin(); }}>
      <label htmlFor="student-name"><UserRound size={16} /> YOUR PLAYER NAME</label>
      <div className="login-input"><input id="student-name" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={event => onUsername(event.target.value)} placeholder="firstnamelastname" aria-describedby="name-help login-error" /><LogIn size={19} /></div>
      <p id="name-help">Type your first and last name together, in lowercase. <span>Bruno Soares → <b>brunosoares</b></span></p>
      {username && normalized !== username && <p className="normalized-name">We’ll look for <b>{normalized || 'yourname'}</b>.</p>}
      {error && <p className="login-error" id="login-error" role="alert">{error}</p>}
      <button className="primary-button login-button" disabled={pending || normalized.length < 3}>{pending ? 'CHECKING…' : <>ENTER MY JOURNEY <ArrowRight size={20} /></>}</button>
    </form>
    <span className="login-language">{languages[selectedLanguage].displayName} is ready for Grade {grade}.</span>
  </section>;
}
