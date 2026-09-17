import { ArrowLeft, LayoutDashboard, Play, RefreshCw, Search, Trophy, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { languages, type Language } from '../data/levels';
import { getTeacherDashboard, isSupabaseConfigured, type TeacherStudent } from '../data/supabase';
import { LanguageIcon } from './Icons';

const order: Language[] = ['python', 'swift', 'csharp'];

export default function TeacherDashboard({ onBack, onPlay }: { onBack: () => void; onPlay: (language: Language) => void }) {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    void getTeacherDashboard()
      .then(data => { if (active) setStudents(data); })
      .catch(() => { if (active) setError('The dashboard could not be loaded. Try again in a moment.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  const classes = useMemo(() => Array.from(new Set(students.map(student => student.className))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [students]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter(student => {
      if (classFilter !== 'all' && student.className !== classFilter) return false;
      if (!needle) return true;
      return student.fullName.toLowerCase().includes(needle) || student.username.includes(needle);
    });
  }, [students, query, classFilter]);

  const totals = useMemo(() => order.map(language => ({
    language,
    score: visible.reduce((sum, student) => sum + student.progress[language].bestScore, 0),
    completed: visible.reduce((sum, student) => sum + student.progress[language].levelsCompleted, 0),
  })), [visible]);

  return <main className="teacher-screen screen-enter" aria-label="Teach dashboard">
    <div className="journey-atmosphere" />
    <header className="teacher-header">
      <button className="icon-button" onClick={onBack} aria-label="Back to home"><ArrowLeft /></button>
      <img src="/assets/logo.webp" alt="Output League" className="small-logo" />
      <div className="teacher-title"><span className="eyebrow">ALL LANGUAGES · ALL STUDENTS</span><h1><LayoutDashboard size={30} /> Teach dashboard<span className="title-dot">.</span></h1></div>
      <button className="icon-button" onClick={() => setReloadKey(value => value + 1)} aria-label="Refresh dashboard"><RefreshCw size={20} /></button>
    </header>

    <section className="teacher-launch" aria-label="Play any language">
      {order.map(language => <button key={language} className={`teacher-launch-card lang-${language}`} onClick={() => onPlay(language)}>
        <LanguageIcon language={language} />
        <span><strong>{languages[language].displayName}</strong><small>Open the full {languages[language].displayName} journey</small></span>
        <Play size={18} fill="currentColor" />
      </button>)}
    </section>

    <section className="teacher-toolbar" aria-label="Filter students">
      <label className="teacher-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a student" aria-label="Search a student" /></label>
      <label className="teacher-class"><Users size={16} /><select value={classFilter} onChange={event => setClassFilter(event.target.value)} aria-label="Filter by class">
        <option value="all">All classes</option>
        {classes.map(name => <option key={name} value={name}>{name}</option>)}
      </select></label>
      <span className="teacher-count"><Users size={15} /> {visible.length} student{visible.length === 1 ? '' : 's'}</span>
      {totals.map(item => <span key={item.language} className={`teacher-total lang-${item.language}`}><Trophy size={14} /> {languages[item.language].displayName}: {item.completed} levels · {item.score.toLocaleString('en-US')} pts</span>)}
    </section>

    <section className="teacher-table" aria-label="Student progress">
      <div className="teacher-row teacher-row-head"><span>Student</span><span>Class</span>{order.map(language => <span key={language}><LanguageIcon language={language} /> {languages[language].displayName}</span>)}</div>
      {visible.map(student => <div className="teacher-row" key={`${student.id}-${student.grade}`}>
        <span className="teacher-student"><strong>{student.fullName}</strong><small>@{student.username} · Grade {student.grade}</small></span>
        <span className="teacher-class-name">{student.className}</span>
        {order.map(language => { const progress = student.progress[language]; return <span key={language} className={`teacher-progress lang-${language}`}>
          <b>{progress.bestScore.toLocaleString('en-US')}</b>
          <small>{progress.levelsCompleted} level{progress.levelsCompleted === 1 ? '' : 's'} · {progress.stars} star{progress.stars === 1 ? '' : 's'}</small>
        </span>; })}
      </div>)}
      {!loading && !visible.length && <p className="teacher-empty">No students match this filter.</p>}
      {loading && <div className="teacher-loading"><RefreshCw className="spin" /> Loading every student…</div>}
      {!isSupabaseConfigured && <p className="leaderboard-notice">The dashboard comes online when the Supabase project URL is added.</p>}
      {error && <p className="login-error" role="alert">{error}</p>}
    </section>
  </main>;
}
