import { useEffect, useState } from 'react';
import { ArrowLeft, Crown, RotateCcw, Star, LockKeyhole } from 'lucide-react';
import type { MatchSnapshot } from '../game/match';
import Modal from './Modal';
export default function Results({ state, replay, journey }: { state: MatchSnapshot; replay: () => void; journey: () => void }) {
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => { let frame = 0; const start = performance.now(); const step = (now: number) => { const progress = Math.min(1, (now - start) / 1000); setDisplayScore(Math.round(state.score * (1 - Math.pow(1 - progress, 3)))); if (progress < 1) frame = requestAnimationFrame(step); }; frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame); }, [state.score]);
  const b = state.breakdown;
  return <Modal label="Level complete" className="results-modal"><div className="result-crown"><Crown size={42} /></div><span className="eyebrow success-text">LEVEL COMPLETE</span><h2>PRINT<span className="title-dot">.</span></h2><p className="muted">You read the code. You owned the arena.</p><div className="result-stars" aria-label={`${state.stars} of 3 stars`}>{[1, 2, 3].map(n => <Star key={n} className={n <= state.stars ? 'earned' : ''} style={{ animationDelay: `${n * 160}ms` }} />)}</div>
    <div className="score-breakdown">{[['Round XP', b.roundXP], ['Accuracy bonus', b.accuracy], ['Streak bonus', b.streak], ['Clean shots', b.cleanShot], ['Special arena', b.special], ['Mastery bonus', b.mastery], ...(b.penalties ? [['Wrong goals', -b.penalties]] : [])].map(([label, value]) => <div key={label}><span>{label}</span><strong>{Number(value) >= 0 ? '+' : '−'}{Math.abs(Number(value))}</strong></div>)}</div>
    <div className="total-score"><span>TOTAL SCORE</span><strong>{displayScore.toLocaleString('en-US')}<small>XP</small></strong></div>
    <p className="accuracy-note">{Math.round(11 / (11 + state.totalWrong) * 100)}% output accuracy · {state.cleanShots} clean shots</p><div className="result-actions"><button className="primary-button" onClick={replay}><RotateCcw size={20} /> REPLAY</button><button className="secondary-button" onClick={journey}><ArrowLeft size={19} /> BACK TO JOURNEY</button></div><div className="next-locked"><LockKeyhole size={15} /><span>LEVEL 2 — SIMPLE VARIABLES <b>COMING SOON</b></span></div>
  </Modal>;
}
