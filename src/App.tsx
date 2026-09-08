import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Code2, LockKeyhole, Play, Settings2, Star, Terminal, Trophy } from 'lucide-react';
import { pythonLevels, type Level, type Language } from './data/levels';
import { getProgress, getSettings, saveSettings, type Settings as SettingsValue } from './data/storage';
import { PythonIcon } from './components/Icons';
import Island from './components/Island';
import Modal from './components/Modal';
import Settings from './components/Settings';
import BootSplash from './components/BootSplash';
const Game = lazy(() => import('./components/Game'));
type PlayableLevel = 1 | 2 | 3 | 4;
type Route = '/' | '/python' | `/python/level/${PlayableLevel}`;
function routeLevel(route: Route): PlayableLevel | null { const match = route.match(/^\/python\/level\/([1-4])$/); return match ? Number(match[1]) as PlayableLevel : null; }
function readRoute(): Route {
  const match = location.pathname.match(/^\/python\/level\/([1-4])$/), levelId = match ? Number(match[1]) : 0;
  if (levelId && (levelId === 1 || getProgress(levelId - 1).complete)) return location.pathname as Route;
  return location.pathname === '/python' ? '/python' : levelId ? '/python' : '/';
}
const levelIntroductions: Record<PlayableLevel, { heading: string; accent: string; body: string }> = {
  1: { heading: 'Small code.', accent: 'Big first goal.', body: 'Meet print(). Read a line of Python, work out the output, and send the ball into the right goal.' },
  2: { heading: 'Name the memory.', accent: 'Retrieve the value.', body: 'Store numbers and text in variables, then follow the variable inside print() to the right output.' },
  3: { heading: 'Track each change.', accent: 'Know the current state.', body: 'Follow reassignment and copied values from top to bottom before choosing the output.' },
  4: { heading: 'Run the operation.', accent: 'Store the result.', body: 'Work through basic addition, subtraction, multiplication, and division one line at a time.' },
};
export default function App() {
  const [route, setRoute] = useState<Route>(readRoute); const [transition, setTransition] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [language, setLanguage] = useState<Language>('python'); const [settings, setSettings] = useState(getSettings);
  const [settingsOpen, setSettingsOpen] = useState(false); const [toast, setToast] = useState('');
  const [locked, setLocked] = useState<number | string | null>(null); const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = pythonLevels.map(level => getProgress(level.id));
  const completedCount = progress.slice(0, 4).filter(item => item.complete).length;
  const isUnlocked = (levelId: number) => levelId === 1 || (levelId <= 4 && progress[levelId - 2].complete);
  useEffect(() => { const back = () => { if (navigationTimer.current) clearTimeout(navigationTimer.current); setTransition(false); setSelectedLevel(null); setSettingsOpen(false); setRoute(readRoute()); }; window.addEventListener('popstate', back); return () => { window.removeEventListener('popstate', back); if (navigationTimer.current) clearTimeout(navigationTimer.current); }; }, []);
  useEffect(() => { document.documentElement.dataset.reducedMotion = String(settings.reducedMotion); saveSettings(settings); }, [settings]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => { setToast(''); setLocked(null); }, 2300); return () => clearTimeout(timer); }, [toast]);
  const navigate = (to: Route) => { if (transition) return; setSelectedLevel(null); setToast(''); setTransition(true); navigationTimer.current = setTimeout(() => { history.pushState({}, '', to); setRoute(to); setTransition(false); }, settings.reducedMotion ? 0 : 320); };
  const comingSoon = (name: string, id: number | string) => { setToast(`${name} — COMING SOON`); setLocked(id); };
  const changeSettings = (next: SettingsValue) => setSettings(next);
  return <div className={`app-shell ${transition ? 'transition-out' : ''}`}>
    <BootSplash reducedMotion={settings.reducedMotion} onComplete={setBootReady} />
    {route === '/' && <main className="home-screen screen-enter"><div className="home-world" /><div className="home-shade" /><button className="icon-button settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Settings2 size={25} /></button>
      <section className="launcher"><img className="home-logo" src="/assets/logo.webp" alt="OUTPUT LEAGUE. Code. Think. Score." /><div className="language-picker"><h1>CHOOSE YOUR LANGUAGE</h1><div className="language-cards"><button className={`language-card python-card ${language === 'python' ? 'selected' : ''}`} aria-pressed={language === 'python'} onClick={() => setLanguage('python')}><span className="selected-check"><Check size={13} strokeWidth={3} /></span><PythonIcon /><strong>Python</strong><span className="card-caption">YOUR JOURNEY STARTS HERE</span></button><button className={`language-card csharp-card ${locked === 'csharp' ? 'locked-bounce' : ''}`} aria-disabled="true" onClick={() => comingSoon('C#', 'csharp')}><LockKeyhole className="card-lock" size={16} /><span className="csharp-icon">C<sup>#</sup></span><strong>C#</strong><span className="card-caption">COMING SOON</span></button></div><button className="primary-button play-button" disabled={language !== 'python'} onClick={() => navigate('/python')}><Play size={26} fill="currentColor" /> PLAY <ArrowRight size={24} /></button></div>
    </section></main>}
    {route === '/python' && <main className="journey-screen screen-enter"><div className="journey-atmosphere" /><header className="journey-header"><button className="icon-button" onClick={() => navigate('/')} aria-label="Back to home"><ArrowLeft /></button><img src="/assets/logo.webp" alt="Output League" className="small-logo" /><div className="journey-language"><PythonIcon /><span>PYTHON</span><span className="language-pill">JOURNEY</span></div><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Settings2 /></button></header>
      <div className="journey-heading"><div><span className="eyebrow">ONE LINE AT A TIME. ONE GOAL CLOSER.</span><h1>Your Python journey<span className="title-dot">.</span></h1></div><div className="journey-progress"><Trophy size={20} /><span><strong>{completedCount} <small>/ 8</small></strong><small>ARENAS COMPLETED</small></span></div></div>
      <section className="journey-map" aria-label="Eight Python levels"><svg className="journey-path" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><path d="M125 130H845Q975 130 945 265T875 380H125" /><path className="active-path" d="M125 130H245" /></svg>{pythonLevels.map(level => { const unlocked = isUnlocked(level.id), levelProgress = progress[level.id - 1]; return <button key={level.id} style={{ '--node-column': level.id <= 4 ? level.id : 9 - level.id, '--node-row': level.id <= 4 ? 1 : 2 } as React.CSSProperties} className={`level-node ${unlocked ? 'is-active' : 'is-locked'} ${locked === level.id ? 'locked-bounce' : ''}`} aria-disabled={!unlocked} aria-label={`Level ${level.id}: ${level.title}${unlocked ? ', playable' : ', locked'}`} onClick={() => unlocked ? setSelectedLevel(level) : comingSoon(level.title, level.id)}>
        <Island level={{ ...level, locked: !unlocked }} /><div className="node-details"><span className="level-number">{unlocked ? <Play size={11} fill="currentColor" /> : <LockKeyhole size={13} />} LEVEL {String(level.id).padStart(2, '0')}</span><h2>{level.title}</h2><p>{level.description}</p><div className="node-stars" aria-label={`${levelProgress.stars} of 3 stars`}>{[1, 2, 3].map(n => <Star key={n} size={17} className={n <= levelProgress.stars ? 'earned' : ''} />)}</div>{unlocked && <span className="node-play">{levelProgress.complete ? `REPLAY · BEST ${levelProgress.bestScore.toLocaleString('en-US')}` : 'ENTER ARENA'} <ChevronRight size={14} /></span>}</div>
      </button>; })}</section><footer className="journey-footer"><span><span className="status-dot" /> YOUR NEXT GOAL STARTS HERE</span><span><LockKeyhole size={13} /> More arenas are on the horizon.</span></footer>
    </main>}
    {routeLevel(route) && <Suspense fallback={<div className="loading-screen"><Terminal size={36} /><strong>ENTERING THE ARENA</strong></div>}><Game levelId={routeLevel(route)!} entranceReady={bootReady} settings={settings} onSettingsChange={changeSettings} onJourney={() => navigate('/python')} /></Suspense>}
    {settingsOpen && <Settings value={settings} onChange={changeSettings} onClose={() => setSettingsOpen(false)} />}
    {selectedLevel && <Modal label={`Level ${selectedLevel.id}: ${selectedLevel.title}`} onClose={() => setSelectedLevel(null)} className="level-modal"><div className="level-modal-art"><Island level={{ ...selectedLevel, locked: false }} /></div><span className="eyebrow">PYTHON · LEVEL {String(selectedLevel.id).padStart(2, '0')}</span><h2>{levelIntroductions[selectedLevel.id as PlayableLevel].heading}<br /><span className="cyan-text">{levelIntroductions[selectedLevel.id as PlayableLevel].accent}</span></h2><p>{levelIntroductions[selectedLevel.id as PlayableLevel].body}</p><div className="level-facts"><span><Code2 size={19} /> 10 rounds</span><span><Trophy size={19} /> 3 stars to earn</span></div><button className="primary-button" onClick={() => navigate(`/python/level/${selectedLevel.id}` as Route)}><Play size={22} fill="currentColor" /> PLAY MATCH <ArrowRight size={21} /></button><span className="quiet-note">No timer. Find your rhythm.</span></Modal>}
    {toast && <div className="toast" role="status"><LockKeyhole size={17} />{toast}</div>}
  </div>;
}
