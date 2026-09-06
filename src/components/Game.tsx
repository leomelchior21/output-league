import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, Pause, Play, RotateCcw, Settings2, Terminal } from 'lucide-react';
import type { Controls as ControlState, Feedback } from '../game/ArenaScene';
import { GameAudio } from '../game/audio';
import { Match, type MatchSnapshot } from '../game/match';
import { saveProgress, hasSeenTutorial, rememberTutorial, type Settings as SettingsValue } from '../data/storage';
import Controls from './Controls';
import Modal from './Modal';
import Results from './Results';
import Settings from './Settings';
import LearningCard, { CodeDemo } from './LearningCard';

export default function Game({ onJourney, settings, onSettingsChange, entranceReady }: { onJourney: () => void; settings: SettingsValue; onSettingsChange: (s: SettingsValue) => void; entranceReady: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<ControlState>({ x: 0, y: 0, boost: false, kick: false, kickRequested: false, paused: true, reducedMotion: settings.reducedMotion, settings });
  const audio = useRef(new GameAudio());
  const [snapshot, setSnapshot] = useState<MatchSnapshot>(() => new Match().snapshot());
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [ready, setReady] = useState(false); const [paused, setPaused] = useState(false);
  const [tutorial, setTutorial] = useState(() => !hasSeenTutorial()); const [showSettings, setShowSettings] = useState(false);
  const [intro, setIntro] = useState(true); const [recap, setRecap] = useState(false);
  const [results, setResults] = useState(false); const [run, setRun] = useState(0); const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    let disposed = false; let game: { destroy: (removeCanvas: boolean) => void } | undefined;
    setReady(false); setLoadError(false); setIntro(true); controls.current.skipIntro = false; const sound = audio.current;
    void Promise.all([import('phaser'), import('../game/ArenaScene')]).then(([{ default: Phaser }, { ArenaScene }]) => {
      if (disposed) return;
      game = new Phaser.Game({ type: Phaser.CANVAS, fps: { target: 60, smoothStep: false }, parent: host.current!, width: 1200, height: 800, backgroundColor: '#081d32', antialias: true, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { activePointers: 3 }, scene: new ArenaScene({ controls: controls.current, audio: sound, onSnapshot: setSnapshot, onFeedback: setFeedback, onReady: () => setReady(true), onIntroComplete: () => setIntro(false) }) });
    }).catch(() => { if (!disposed) setLoadError(true); });
    return () => { disposed = true; game?.destroy(true); };
  }, [run]);
  useEffect(() => { controls.current.paused = paused || tutorial || showSettings || !ready || !entranceReady || results || recap; if (controls.current.paused) Object.assign(controls.current, { x: 0, y: 0, boost: false, kick: false, kickRequested: false }); }, [paused, tutorial, showSettings, ready, entranceReady, results, recap]);
  useEffect(() => { audio.current.enabled = settings.sound; controls.current.reducedMotion = settings.reducedMotion; controls.current.settings = settings; }, [settings]);
  useEffect(() => { const current = audio.current; return () => current.destroy(); }, []);
  useEffect(() => { if (!feedback) return; const timer = setTimeout(() => setFeedback(null), feedback.kind === 'info' ? 3800 : 2300); return () => clearTimeout(timer); }, [feedback]);
  useEffect(() => {
    if (!snapshot.levelComplete) return;
    saveProgress(snapshot.score, snapshot.stars);
    const timer = setTimeout(() => setRecap(true), 2400); return () => clearTimeout(timer);
  }, [snapshot.levelComplete, snapshot.score, snapshot.stars]);
  useEffect(() => {
    const visibility = () => { if (document.hidden) setPaused(true); };
    const keyboard = (e: KeyboardEvent) => { audio.current.unlock(); if (e.key === 'Escape' && !tutorial && !results && !recap && !showSettings) setPaused(p => !p); };
    const blur = () => { Object.assign(controls.current, { x: 0, y: 0, boost: false, kick: false }); setPaused(true); };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('keydown', keyboard); window.addEventListener('blur', blur);
    return () => { document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', keyboard); window.removeEventListener('blur', blur); };
  }, [tutorial, results, showSettings, recap]);
  const start = () => { rememberTutorial(); setTutorial(false); audio.current.unlock(); };
  const replay = () => { controls.current.paused = true; setRecap(false); setResults(false); setPaused(false); setFeedback(null); setSnapshot(new Match().snapshot()); setRun(r => r + 1); };
  return <main className={`game-screen screen-enter ${intro ? 'arena-intro-active' : ''}`}>
    <div className="phaser-host" ref={host} role="img" aria-label="Large top-down octagonal arena with six goals and a camera following your car. The radar and edge labels locate the ball and outputs. Steer and kick the ball into the matching output." />
    {ready && intro && !tutorial && <div className="arena-intro"><span className="eyebrow">WELCOME TO THE OUTPUT LEAGUE</span><h2>SIX GOALS.<br /><span>ONE RIGHT OUTPUT.</span></h2><p>Read the code. Find your line.</p><button className="secondary-button" onClick={() => { controls.current.skipIntro = true; }}>KICK OFF <Play size={16} /></button></div>}
    {feedback && feedback.kind !== 'info' && !recap && !results && <div key={feedback.id} className={`goal-spectacle spectacle-${feedback.kind}`} aria-hidden="true"><div className="goal-halo" />{feedback.kind === 'correct' && Array.from({ length: 36 }, (_, i) => <i key={i} style={{ '--i': i, '--confetti-color': ['#72e4ff', '#ffd079', '#91efb6', '#ed9dff'][i % 4] } as React.CSSProperties} />)}<div className="goal-call"><span>{feedback.kind === 'correct' ? 'THE CROWD GOES WILD' : 'TAKE A BREATH. TRY AGAIN.'}</span><b>{feedback.kind === 'correct' ? 'GOOOAL!' : 'WRONG OUTPUT'}</b>{feedback.kind === 'correct' && <code>{feedback.code?.join(' → ')} <em>→ {feedback.output}</em></code>}</div></div>}
    <header className="game-hud"><div className="game-level"><button className="icon-button" onClick={() => setPaused(true)} aria-label="Back and pause match"><ArrowLeft size={22} /></button><div><span className="eyebrow">PYTHON · LEVEL 01</span><strong>PRINT</strong><span className="round-label">ROUND <b>{String(snapshot.round).padStart(2, '0')}</b> / 10</span></div></div>
      <div className={`code-panel ${snapshot.challenge.outputs.length > 1 ? 'mastery-code' : ''}`}><div className="code-panel-label"><span><Terminal size={14} /> PYTHON</span><span>{snapshot.challenge.outputs.length > 1 ? `OUTPUT ${snapshot.phase + 1} / 2` : 'WHAT GETS PRINTED?'}</span></div>{snapshot.challenge.code.map((line, i) => <div className={`code-line ${i < snapshot.phase ? 'line-done' : ''}`} key={line}><span className="line-number">{i < snapshot.phase ? <Check size={17} /> : i + 1}</span><code><span className="function">print</span>(<span className={line.includes('"') ? 'string' : 'number'}>{line.slice(6, -1)}</span>)</code>{i < snapshot.phase && <Check size={18} className="success-text" />}</div>)}</div>
      <div className="score-hud"><div><span>SCORE</span><strong>{snapshot.score.toLocaleString('en-US')}</strong></div><div><span>STREAK</span><strong className="streak-value">×{snapshot.streak}</strong></div><div><span>XP NOW</span><strong className="xp-value">+{snapshot.potentialXP}</strong></div><button className="icon-button pause-button" onClick={() => setPaused(true)} aria-label="Pause match"><Pause size={22} /></button></div>
    </header>
    <div className="round-dots" aria-label={`Round ${snapshot.round} of 10`}>{Array.from({ length: 10 }, (_, i) => <span key={i} className={i < snapshot.round - 1 ? 'done' : i === snapshot.round - 1 ? 'current' : ''} />)}</div>
    {snapshot.challenge.orbit && <div className="special-badge">ORBIT MODE <span>+40 XP</span></div>}
    {feedback && !results && !recap && <div className={`game-feedback ${feedback.kind}`} role="status"><strong>{feedback.text}</strong><span>{feedback.detail}</span></div>}
    <Controls controls={controls.current} audio={audio.current} kicksRemaining={snapshot.kicksRemaining} kickHidden={snapshot.challenge.orbit} />
    <span className="field-caption">READ. THINK. <b>SCORE.</b></span>
    {!ready && <div className="loading-screen"><div className="loading-mark"><Terminal size={35} /></div><strong>{loadError ? 'THE ARENA COULDN’T LOAD' : 'PREPARING YOUR ARENA'}</strong>{loadError ? <button className="primary-button" onClick={replay}><RotateCcw /> TRY AGAIN</button> : <span>Warming up the engines…</span>}<button className="text-button" onClick={onJourney}>BACK TO JOURNEY</button></div>}
    {ready && tutorial && <Modal label="How to play" onClose={start} className="tutorial-modal"><span className="eyebrow">YOUR FIRST LINE. YOUR FIRST GOAL.</span><h2>READ THE CODE.<br /><span className="cyan-text">SCORE THE OUTPUT.</span></h2><p><code>print()</code> shows a value on screen. Text loses its surrounding quotes; numbers stay numbers. Try this example:</p><CodeDemo code={['print("HI!")']} output={['HI!']} /><div className="tutorial-steps"><span><b>01</b> READ</span><ChevronRight size={17} /><span><b>02</b> DRIVE</span><ChevronRight size={17} /><span><b>03</b> SCORE</span></div><p className="tutorial-reassurance">Drive with the joystick or WASD. Hold BOOST for speed.<br />Tap KICK / Space near the ball, toward the matching goal.</p><button className="primary-button" onClick={start}><Play size={21} fill="currentColor" /> LET’S DRIVE</button><span className="keyboard-note">No countdown. Wrong goals give you another shot.</span></Modal>}
    {paused && !tutorial && !results && !showSettings && <Modal label="Match paused" onClose={() => setPaused(false)} className="pause-modal"><span className="eyebrow">TAKE A BREATHER</span><h2>Game paused.</h2><p className="muted">Your car and XP are right where you left them.</p><button className="primary-button" onClick={() => setPaused(false)}><Play size={19} fill="currentColor" /> RESUME MATCH</button><button className="secondary-button" onClick={() => setShowSettings(true)}><Settings2 size={19} /> SETTINGS</button><button className="text-button" onClick={onJourney}><ArrowLeft size={18} /> BACK TO JOURNEY</button><small className="muted">Leaving ends this match. Your best score stays saved.</small></Modal>}
    {showSettings && <Settings value={settings} onChange={onSettingsChange} onClose={() => setShowSettings(false)} />}
    {recap && <LearningCard code={snapshot.challenge.code} output={snapshot.challenge.outputs} onContinue={() => { setRecap(false); setResults(true); }} />}
    {results && <Results state={snapshot} replay={replay} journey={onJourney} />}
  </main>;
}
