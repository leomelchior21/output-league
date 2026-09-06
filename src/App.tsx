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
type Route = '/' | '/python' | '/python/level/1';
function readRoute(): Route { return location.pathname === '/python/level/1' ? '/python/level/1' : location.pathname === '/python' ? '/python' : '/'; }
export default function App() {
  const [route, setRoute] = useState<Route>(readRoute); const [transition, setTransition] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [language, setLanguage] = useState<Language>('python'); const [settings, setSettings] = useState(getSettings);
  const [settingsOpen, setSettingsOpen] = useState(false); const [toast, setToast] = useState('');
  const [locked, setLocked] = useState<number | string | null>(null); const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = getProgress();
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
      <div className="journey-heading"><div><span className="eyebrow">ONE LINE AT A TIME. ONE GOAL CLOSER.</span><h1>Your Python journey<span className="title-dot">.</span></h1></div><div className="journey-progress"><Trophy size={20} /><span><strong>{progress.complete ? '1' : '0'} <small>/ 8</small></strong><small>ARENAS COMPLETED</small></span></div></div>
      <section className="journey-map" aria-label="Eight Python levels"><svg className="journey-path" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><path d="M125 130H845Q975 130 945 265T875 380H125" /><path className="active-path" d="M125 130H245" /></svg>{pythonLevels.map(level => <button key={level.id} style={{ '--node-column': level.id <= 4 ? level.id : 9 - level.id, '--node-row': level.id <= 4 ? 1 : 2 } as React.CSSProperties} className={`level-node ${level.locked ? 'is-locked' : 'is-active'} ${locked === level.id ? 'locked-bounce' : ''}`} aria-disabled={level.locked} aria-label={`Level ${level.id}: ${level.title}${level.locked ? ', locked, coming soon' : ', playable'}`} onClick={() => level.locked ? comingSoon(level.title, level.id) : setSelectedLevel(level)}>
        <Island level={level} /><div className="node-details"><span className="level-number">{level.locked ? <LockKeyhole size={13} /> : <Play size={11} fill="currentColor" />} LEVEL {String(level.id).padStart(2, '0')}</span><h2>{level.title}</h2><p>{level.description}</p><div className="node-stars" aria-label={`${level.id === 1 ? progress.stars : 0} of 3 stars`}>{[1, 2, 3].map(n => <Star key={n} size={17} className={level.id === 1 && n <= progress.stars ? 'earned' : ''} />)}</div>{level.id === 1 && <span className="node-play">{progress.complete ? `REPLAY · BEST ${progress.bestScore.toLocaleString('en-US')}` : 'ENTER ARENA'} <ChevronRight size={14} /></span>}</div>
      </button>)}</section><footer className="journey-footer"><span><span className="status-dot" /> YOUR NEXT GOAL STARTS HERE</span><span><LockKeyhole size={13} /> More arenas are on the horizon.</span></footer>
    </main>}
    {route === '/python/level/1' && <Suspense fallback={<div className="loading-screen"><Terminal size={36} /><strong>ENTERING THE ARENA</strong></div>}><Game entranceReady={bootReady} settings={settings} onSettingsChange={changeSettings} onJourney={() => navigate('/python')} /></Suspense>}
    {settingsOpen && <Settings value={settings} onChange={changeSettings} onClose={() => setSettingsOpen(false)} />}
    {selectedLevel && <Modal label="Level 1: Print" onClose={() => setSelectedLevel(null)} className="level-modal"><div className="level-modal-art"><Island level={selectedLevel} /></div><span className="eyebrow">PYTHON · LEVEL 01</span><h2>Small code.<br /><span className="cyan-text">Big first goal.</span></h2><p>Meet <code>print()</code>. Read a line of Python, work out the output, and send the ball into the right goal.</p><div className="level-facts"><span><Code2 size={19} /> 10 rounds</span><span><Trophy size={19} /> 3 stars to earn</span></div><button className="primary-button" onClick={() => navigate('/python/level/1')}><Play size={22} fill="currentColor" /> PLAY MATCH <ArrowRight size={21} /></button><span className="quiet-note">No timer. Find your rhythm.</span></Modal>}
    {toast && <div className="toast" role="status"><LockKeyhole size={17} />{toast}</div>}
  </div>;
}
