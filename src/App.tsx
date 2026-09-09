import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Code2, LockKeyhole, Play, Settings2, Star, Terminal, Trophy } from 'lucide-react';
import { isLanguage, languages, type Level, type Language } from './data/levels';
import { getProgress, getSettings, saveSettings, type Settings as SettingsValue } from './data/storage';
import { LanguageIcon } from './components/Icons';
import Island from './components/Island';
import Modal from './components/Modal';
import Settings from './components/Settings';
import BootSplash from './components/BootSplash';

const Game = lazy(() => import('./components/Game'));
type PlayableLevel = 1 | 2 | 3 | 4;
type Route = string;
interface RouteInfo { language: Language; levelId: PlayableLevel | null }

function parseRoute(pathname: string): RouteInfo | null {
  const match = pathname.match(/^\/(python|csharp|swift)(?:\/level\/([1-4]))?$/);
  if (!match || !isLanguage(match[1])) return null;
  return { language: match[1], levelId: match[2] ? Number(match[2]) as PlayableLevel : null };
}

function readRoute(): Route {
  const info = parseRoute(location.pathname);
  if (!info) return '/';
  if (info.levelId && info.levelId > 1 && !getProgress(info.levelId - 1, info.language).complete) return `/${info.language}`;
  return location.pathname;
}

function introduction(language: Language, levelId: PlayableLevel) {
  const name = languages[language].displayName;
  const outputCall = language === 'csharp' ? 'Console.WriteLine()' : 'print()';
  const values = language === 'csharp' ? 'typed variables' : 'variables';
  return {
    1: { heading: 'Small code.', accent: 'Big first goal.', body: `Meet ${outputCall}. Read a line of ${name}, work out the output, and send the ball into the right goal.` },
    2: { heading: 'Name the memory.', accent: 'Retrieve the value.', body: `Store numbers and text in ${values}, then follow the variable inside ${outputCall} to the right output.` },
    3: { heading: 'Track each change.', accent: 'Know the current state.', body: 'Follow reassignment and copied values from top to bottom before choosing the output.' },
    4: { heading: 'Run the operation.', accent: 'Store the result.', body: `Work through ${language === 'python' ? 'addition, subtraction, multiplication, and decimal division' : 'addition, subtraction, multiplication, and integer division'} one line at a time.` },
  }[levelId];
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);
  const [transition, setTransition] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [language, setLanguage] = useState<Language>('python');
  const [settings, setSettings] = useState(getSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [locked, setLocked] = useState<number | string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const navigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeInfo = parseRoute(route);
  const activeLanguage = routeInfo?.language ?? language;
  const pack = languages[activeLanguage];
  const progress = pack.levels.map(level => getProgress(level.id, activeLanguage));
  const completedCount = progress.slice(0, 4).filter(item => item.complete).length;
  const isUnlocked = (levelId: number) => levelId === 1 || (levelId <= 4 && progress[levelId - 2].complete);

  useEffect(() => {
    const back = () => {
      if (navigationTimer.current) clearTimeout(navigationTimer.current);
      setTransition(false); setSelectedLevel(null); setSettingsOpen(false); setRoute(readRoute());
    };
    window.addEventListener('popstate', back);
    return () => { window.removeEventListener('popstate', back); if (navigationTimer.current) clearTimeout(navigationTimer.current); };
  }, []);
  useEffect(() => { document.documentElement.dataset.reducedMotion = String(settings.reducedMotion); saveSettings(settings); }, [settings]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => { setToast(''); setLocked(null); }, 2300); return () => clearTimeout(timer); }, [toast]);

  const navigate = (to: Route) => {
    if (transition) return;
    setSelectedLevel(null); setToast(''); setTransition(true);
    navigationTimer.current = setTimeout(() => { history.pushState({}, '', to); setRoute(to); setTransition(false); }, settings.reducedMotion ? 0 : 320);
  };
  const comingSoon = (name: string, id: number | string) => { setToast(`${name} — COMING SOON`); setLocked(id); };
  const changeSettings = (next: SettingsValue) => setSettings(next);

  return <div className={`app-shell lang-${activeLanguage} ${transition ? 'transition-out' : ''}`}>
    <BootSplash reducedMotion={settings.reducedMotion} onComplete={setBootReady} />
    {route === '/' && <main className="home-screen screen-enter"><div className="home-world" /><div className="home-shade" /><button className="icon-button settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Settings2 size={25} /></button>
      <section className="launcher"><img className="home-logo" src="/assets/logo.webp" alt="OUTPUT LEAGUE. Code. Think. Score." /><div className="language-picker"><h1>CHOOSE YOUR LANGUAGE</h1><div className="language-cards">
        {(Object.keys(languages) as Language[]).map(id => { const option = languages[id]; return <button key={id} className={`language-card ${id}-card ${language === id ? 'selected' : ''}`} aria-pressed={language === id} onClick={() => setLanguage(id)}><span className="selected-check"><Check size={13} strokeWidth={3} /></span><LanguageIcon language={id} /><strong>{option.displayName}</strong><span className="card-caption">{language === id ? 'READY TO PLAY' : 'CHOOSE JOURNEY'}</span></button>; })}
      </div><button className="primary-button play-button" onClick={() => navigate(`/${language}`)}><Play size={26} fill="currentColor" /> PLAY <ArrowRight size={24} /></button></div></section>
    </main>}

    {routeInfo && !routeInfo.levelId && <main className={`journey-screen screen-enter lang-${activeLanguage}`}><div className="journey-atmosphere" /><header className="journey-header"><button className="icon-button" onClick={() => navigate('/')} aria-label="Back to home"><ArrowLeft /></button><img src="/assets/logo.webp" alt="Output League" className="small-logo" /><div className="journey-language"><LanguageIcon language={activeLanguage} /><span>{pack.displayName.toUpperCase()}</span><span className="language-pill">JOURNEY</span></div><button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings"><Settings2 /></button></header>
      <div className="journey-heading"><div><span className="eyebrow">ONE LINE AT A TIME. ONE GOAL CLOSER.</span><h1>{pack.journeyTitle}<span className="title-dot">.</span></h1></div><div className="journey-progress"><Trophy size={20} /><span><strong>{completedCount} <small>/ 8</small></strong><small>ARENAS COMPLETED</small></span></div></div>
      <section className="journey-map" aria-label={`Eight ${pack.displayName} levels`}><svg className="journey-path" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true"><path d="M125 130H845Q975 130 945 265T875 380H125" /><path className="active-path" d="M125 130H245" /></svg>{pack.levels.map(level => { const unlocked = isUnlocked(level.id), levelProgress = progress[level.id - 1]; return <button key={level.id} style={{ '--node-column': level.id <= 4 ? level.id : 9 - level.id, '--node-row': level.id <= 4 ? 1 : 2 } as React.CSSProperties} className={`level-node ${unlocked ? 'is-active' : 'is-locked'} ${locked === level.id ? 'locked-bounce' : ''}`} aria-disabled={!unlocked} aria-label={`Level ${level.id}: ${level.title}${unlocked ? ', playable' : ', locked'}`} onClick={() => unlocked ? setSelectedLevel(level) : comingSoon(level.title, level.id)}>
        <Island level={{ ...level, locked: !unlocked }} /><div className="node-details"><span className="level-number">{unlocked ? <Play size={11} fill="currentColor" /> : <LockKeyhole size={13} />} LEVEL {String(level.id).padStart(2, '0')}</span><h2>{level.title}</h2><p>{level.description}</p><div className="node-stars" aria-label={`${levelProgress.stars} of 3 stars`}>{[1, 2, 3].map(n => <Star key={n} size={17} className={n <= levelProgress.stars ? 'earned' : ''} />)}</div>{unlocked && <span className="node-play">{levelProgress.complete ? `REPLAY · BEST ${levelProgress.bestScore.toLocaleString('en-US')}` : 'ENTER ARENA'} <ChevronRight size={14} /></span>}{!unlocked && level.id > 4 && <span className="coming-soon-label">COMING SOON</span>}</div>
      </button>; })}</section><footer className="journey-footer"><span><span className="status-dot" /> YOUR NEXT GOAL STARTS HERE</span><span><LockKeyhole size={13} /> More arenas are on the horizon.</span></footer>
    </main>}

    {routeInfo?.levelId && <Suspense fallback={<div className="loading-screen"><Terminal size={36} /><strong>ENTERING THE ARENA</strong></div>}><Game language={activeLanguage} levelId={routeInfo.levelId} entranceReady={bootReady} settings={settings} onSettingsChange={changeSettings} onJourney={() => navigate(`/${activeLanguage}`)} /></Suspense>}
    {settingsOpen && <Settings value={settings} onChange={changeSettings} onClose={() => setSettingsOpen(false)} />}
    {selectedLevel && (() => { const intro = introduction(selectedLevel.language, selectedLevel.id as PlayableLevel); const selectedPack = languages[selectedLevel.language]; return <Modal label={`Level ${selectedLevel.id}: ${selectedLevel.title}`} onClose={() => setSelectedLevel(null)} className={`level-modal lang-${selectedLevel.language}`}><div className="level-modal-art"><Island level={{ ...selectedLevel, locked: false }} /></div><span className="eyebrow">{selectedPack.displayName.toUpperCase()} · LEVEL {String(selectedLevel.id).padStart(2, '0')}</span><h2>{intro.heading}<br /><span className="cyan-text">{intro.accent}</span></h2><p>{intro.body}</p><div className="level-facts"><span><Code2 size={19} /> 10 rounds</span><span><Trophy size={19} /> 3 stars to earn</span></div><button className="primary-button" onClick={() => navigate(`/${selectedLevel.language}/level/${selectedLevel.id}`)}><Play size={22} fill="currentColor" /> PLAY MATCH <ArrowRight size={21} /></button><span className="quiet-note">No timer. Find your rhythm.</span></Modal>; })()}
    {toast && <div className="toast" role="status"><LockKeyhole size={17} />{toast}</div>}
  </div>;
}
