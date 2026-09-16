import { Crown, Medal, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { languages, type Language } from '../data/levels';
import { getAllTimeLeaders, isSupabaseConfigured, type LeaderboardEntry } from '../data/supabase';
import { LanguageIcon } from './Icons';
import Modal from './Modal';

const order: Language[] = ['python', 'swift', 'csharp'];

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const [leaders, setLeaders] = useState<Record<Language, LeaderboardEntry[]>>({ python: [], swift: [], csharp: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    void getAllTimeLeaders().then(data => { if (active) setLeaders(data); }).catch(() => { if (active) setError('The standings could not be loaded. Try again in a moment.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <Modal label="All-time leaders" onClose={onClose} className="leaderboard-modal"><div className="leaderboard-title"><Crown /><span><span className="eyebrow">OUTPUT LEAGUE HALL OF FAME</span><h2>All-time leaders.</h2></span></div>
    <p className="muted">The top 10 students in each coding journey, ranked by their combined level bests.</p>
    <div className="leaderboard-grid">{order.map(language => <section className={`leaderboard-column lang-${language}`} key={language}><header><LanguageIcon language={language} /><span><strong>{languages[language].displayName}</strong><small>TOP 10</small></span></header><ol>
      {leaders[language].map(player => <li key={`${player.rank}-${player.displayName}`}><span className="leader-rank">{player.rank <= 3 ? <Medal /> : player.rank}</span><span className="leader-name">{player.displayName}<small>{player.levelsCompleted} level{player.levelsCompleted === 1 ? '' : 's'} · {player.totalStars} stars</small></span><b>{player.totalScore.toLocaleString('en-US')}</b></li>)}
      {!loading && !leaders[language].length && <li className="empty-leaders">No scores yet. Be the first.</li>}
    </ol></section>)}</div>
    {loading && <div className="leaderboard-loading"><Trophy /> LOADING THE STANDINGS…</div>}
    {!isSupabaseConfigured && <p className="leaderboard-notice">Standings will come online when the Supabase project URL is added.</p>}
    {error && <p className="login-error" role="alert">{error}</p>}
  </Modal>;
}
