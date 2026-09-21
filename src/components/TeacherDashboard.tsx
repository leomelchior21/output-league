import { ArrowLeft, LayoutDashboard, Play, RefreshCw, Search, Trophy, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { languages, type Language } from '../data/levels';
import { getStudentSession, getTeacherDashboard, isSupabaseConfigured, type TeacherStudent } from '../data/supabase';
import { LanguageIcon } from './Icons';

const order: Language[] = ['python', 'swift', 'csharp'];
const liveRefreshMs = 5000;
const years: { grade: 7 | 8 | 9; language: Language; label: string }[] = [
  { grade: 7, language: 'python', label: '7th' },
  { grade: 8, language: 'swift', label: '8th' },
  { grade: 9, language: 'csharp', label: '9th' },
];

export default function TeacherDashboard({ onBack, onPlay }: { onBack: () => void; onPlay: (language: Language) => void }) {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [year, setYear] = useState<7 | 8 | 9>(() => getStudentSession()?.grade ?? 7);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async (initial: boolean) => {
      if (initial) { setLoading(true); setError(''); }
      try {
        const data = await getTeacherDashboard();
        if (!active) return;
        setStudents(data); setError(''); setLastUpdated(new Date());
      } catch {
        if (active) { setError('The dashboard could not be loaded. Try again in a moment.'); setLastUpdated(null); }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load(true);
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void load(false); }, liveRefreshMs);
    const onVisibility = () => { if (document.visibilityState === 'visible') void load(false); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { active = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVisibility); };
  }, [reloadKey]);

  const activeYear = years.find(item => item.grade === year) ?? years[0];
  const yearStudents = useMemo(() => students.filter(student => student.grade === year), [students, year]);
  const classes = useMemo(() => Array.from(new Set(yearStudents.map(student => student.className))).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })), [yearStudents]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return yearStudents.filter(student => {
      if (classFilter !== 'all' && student.className !== classFilter) return false;
      if (!needle) return true;
      return student.fullName.toLowerCase().includes(needle) || student.username.includes(needle);
    });
  }, [yearStudents, query, classFilter]);

  const totals = useMemo(() => visible.reduce((sum, student) => {
    const progress = student.progress[activeYear.language];
    return { score: sum.score + progress.bestScore, completed: sum.completed + progress.levelsCompleted, stars: sum.stars + progress.stars };
  }, { score: 0, completed: 0, stars: 0 }), [visible, activeYear.language]);

  const yearCounts = useMemo(() => Object.fromEntries(years.map(item => [item.grade, students.filter(student => student.grade === item.grade).length])), [students]);

  const selectYear = (nextGrade: 7 | 8 | 9) => { setYear(nextGrade); setClassFilter('all'); };

  return <main className="teacher-screen screen-enter" aria-label="Teach dashboard">
    <div className="journey-atmosphere" />
    <header className="teacher-header">
      <button className="icon-button" onClick={onBack} aria-label="Back to home"><ArrowLeft /></button>
      <img src="/assets/logo.webp" alt="Output League" className="small-logo" />
      <div className="teacher-title"><span className="eyebrow">EVERY YEAR · LIVE SCORES</span><h1><LayoutDashboard size={30} /> Teach dashboard<span className="title-dot">.</span></h1></div>
      <span className={`teacher-live ${error ? 'is-offline' : ''}`} aria-hidden="true"><span className="teacher-live-dot" /> {error ? 'RECONNECTING' : 'LIVE'}{lastUpdated && <small>{lastUpdated.toLocaleTimeString('en-US', { hour12: false })}</small>}</span>
      <button className="icon-button" onClick={() => setReloadKey(value => value + 1)} aria-label="Refresh dashboard"><RefreshCw size={20} /></button>
    </header>

    <section className="teacher-launch" aria-label="Play any language">
      {order.map(language => <button key={language} className={`teacher-launch-card lang-${language} ${language === activeYear.language ? 'is-current' : ''}`} onClick={() => onPlay(language)}>
        <LanguageIcon language={language} />
        <span><strong>{languages[language].displayName}</strong><small>Open the full {languages[language].displayName} journey</small></span>
        <Play size={18} fill="currentColor" />
      </button>)}
    </section>

    <section className="teacher-years" aria-label="Separate by school year">
      {years.map(item => <button key={item.grade} className={`teacher-year lang-${item.language} ${item.grade === year ? 'is-active' : ''}`} aria-pressed={item.grade === year} onClick={() => selectYear(item.grade)}>
        <LanguageIcon language={item.language} />
        <span><strong>{item.label} grade</strong><small>{languages[item.language].displayName} · {yearCounts[item.grade] ?? 0} student{(yearCounts[item.grade] ?? 0) === 1 ? '' : 's'}</small></span>
      </button>)}
    </section>

    <section className="teacher-toolbar" aria-label="Filter students">
      <label className="teacher-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search a student" aria-label="Search a student" /></label>
      <label className="teacher-class"><Users size={16} /><select value={classFilter} onChange={event => setClassFilter(event.target.value)} aria-label="Filter by class">
        <option value="all">All {activeYear.label} classes</option>
        {classes.map(name => <option key={name} value={name}>{name}</option>)}
      </select></label>
      <span className="teacher-count"><Users size={15} /> {visible.length} student{visible.length === 1 ? '' : 's'}</span>
      <span className={`teacher-total lang-${activeYear.language}`}><Trophy size={14} /> {languages[activeYear.language].displayName}: {totals.completed} level{totals.completed === 1 ? '' : 's'} · {totals.score.toLocaleString('en-US')} pts · {totals.stars} star{totals.stars === 1 ? '' : 's'}</span>
    </section>

    <section className="teacher-table" aria-label={`${activeYear.label} grade ${languages[activeYear.language].displayName} progress`}>
      <div className="teacher-row teacher-row-head"><span>Student</span><span>Class</span><span><LanguageIcon language={activeYear.language} /> {languages[activeYear.language].displayName} · {activeYear.label} grade</span></div>
      {visible.map(student => { const progress = student.progress[activeYear.language]; return <div className="teacher-row" key={`${student.id}-${student.grade}`}>
        <span className="teacher-student"><strong>{student.fullName}</strong><small>@{student.username} · Grade {student.grade}{student.groupName ? ` · ${student.groupName}` : ''}</small></span>
        <span className="teacher-class-name">{student.className}</span>
        <span className={`teacher-progress lang-${activeYear.language}`}>
          <b>{progress.bestScore.toLocaleString('en-US')}</b>
          <small>{progress.levelsCompleted} level{progress.levelsCompleted === 1 ? '' : 's'} · {progress.stars} star{progress.stars === 1 ? '' : 's'}</small>
        </span>
      </div>; })}
      {!loading && !visible.length && <p className="teacher-empty">No students match this filter.</p>}
      {loading && <div className="teacher-loading"><RefreshCw className="spin" /> Loading every student…</div>}
      {!isSupabaseConfigured && <p className="leaderboard-notice">The dashboard comes online when the Supabase project URL is added.</p>}
      {error && <p className="login-error" role="alert">{error}</p>}
    </section>
  </main>;
}
