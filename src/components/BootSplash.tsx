import { useEffect, useState } from 'react';
export default function BootSplash({ reducedMotion, onComplete }: { reducedMotion: boolean; onComplete: (ready: boolean) => void }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => { const timer = setTimeout(() => { setVisible(false); onComplete(true); }, reducedMotion ? 450 : 1850); return () => clearTimeout(timer); }, [reducedMotion, onComplete]);
  if (!visible) return null;
  return <div className="boot-splash" aria-label="Welcome to Output League"><div className="boot-orbit" /><img src="/assets/logo.webp" alt="" /><span>YOUR NEXT GOAL STARTS WITH ONE LINE.</span><div className="boot-progress" /><button className="text-button" onClick={() => { setVisible(false); onComplete(true); }}>SKIP INTRO</button></div>;
}
