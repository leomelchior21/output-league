import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ChevronsUp, Crosshair, Sparkles } from 'lucide-react';
import type { Controls as ControlState } from '../game/ArenaScene';
import type { GameAudio } from '../game/audio';
const slotGlyphs = ['#', '7', '★', '⚡'];

export default function Controls({ controls, audio, kicksRemaining, kickHidden = false, shockwaveEnabled = false }: { controls: ControlState; audio: GameAudio; kicksRemaining: number; kickHidden?: boolean; shockwaveEnabled?: boolean }) {
  const pointer = useRef<number | null>(null); const [knob, setKnob] = useState({ x: 0, y: 0 });
  const slotTimer = useRef<ReturnType<typeof setInterval> | null>(null); const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [slots, setSlots] = useState(['#', '#', '#']); const [rolling, setRolling] = useState(false); const [rolled, setRolled] = useState(false); const [won, setWon] = useState(false);
  useEffect(() => () => { if (slotTimer.current) clearInterval(slotTimer.current); if (finishTimer.current) clearTimeout(finishTimer.current); }, []);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect(), radius = rect.width * .29;
    const dx = e.clientX - rect.left - rect.width / 2, dy = e.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(dx, dy), scale = distance > radius ? radius / distance : 1;
    const x = dx * scale, y = dy * scale;
    controls.x = x / radius; controls.y = y / radius; setKnob({ x, y });
  };
  const reset = () => { pointer.current = null; controls.x = 0; controls.y = 0; setKnob({ x: 0, y: 0 }); };
  const suspendPointerDrive = () => { if (controls.pointer) controls.pointer.active = false; };
  const rollShockwave = () => {
    if (rolling || rolled) return;
    audio.unlock(); setRolling(true);
    const finish = () => {
      if (slotTimer.current) clearInterval(slotTimer.current);
      const jackpot = Math.random() < .28;
      setSlots(jackpot ? ['#', '#', '#'] : ['7', '★', '⚡']);
      setRolling(false); setRolled(true); setWon(jackpot);
      if (jackpot) controls.shockwaveRequested = true;
    };
    if (controls.reducedMotion) { finish(); return; }
    slotTimer.current = setInterval(() => setSlots(Array.from({ length: 3 }, () => slotGlyphs[Math.floor(Math.random() * slotGlyphs.length)])), 75);
    finishTimer.current = setTimeout(finish, 1050);
  };
  return <div className="controls-layer" onPointerEnter={suspendPointerDrive}>
    <div className="joystick-wrap"><div className="joystick" role="group" aria-label="Analog steering joystick. Drag to steer. Keyboard: WASD or arrow keys." onPointerDown={e => { if (pointer.current !== null) return; audio.unlock(); pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={move} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}>
      <i className="joystick-north" /><i className="joystick-east" /><i className="joystick-south" /><i className="joystick-west" /><div className="joystick-ring" /><div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div><span className="control-hint">DRIVE <kbd>W A S D</kbd></span></div>
    <div className="action-controls"><div><button className="action-button boost-button" aria-label="Boost. Hold Shift on keyboard." onPointerDown={e => { audio.unlock(); e.currentTarget.setPointerCapture(e.pointerId); controls.boost = true; }} onPointerUp={() => { controls.boost = false; }} onPointerCancel={() => { controls.boost = false; }} onLostPointerCapture={() => { controls.boost = false; }} onKeyDown={e => { if (e.key === 'Enter') { audio.unlock(); controls.boost = true; } }} onKeyUp={() => { controls.boost = false; }} onBlur={() => { controls.boost = false; }}><ChevronsUp /><span>BOOST</span></button><span className="control-hint"><kbd>SHIFT</kbd></span></div>
      {(shockwaveEnabled || !kickHidden) && <div className="kick-stack">{shockwaveEnabled && <button className={`shockwave-roll ${rolling ? 'is-rolling' : ''} ${won ? 'is-won' : ''}`} disabled={rolling || rolled} onClick={rollShockwave} aria-label={rolled ? won ? 'Shockwave armed' : 'Shockwave roll missed' : 'Roll for a shockwave'}><Sparkles size={14} /><span className="slot-reels">{slots.map((slot, index) => <i key={index}>{slot}</i>)}</span><b>{rolling ? 'ROLLING' : rolled ? won ? 'ARMED!' : 'MISSED' : 'SHOCKWAVE'}</b></button>}{!kickHidden && <><button className="action-button kick-button" disabled={controls.kickDisabled || kicksRemaining <= 0} aria-label={`Kick. ${kicksRemaining} remaining this round. Press Space on keyboard.`} onPointerDown={e => { if (controls.kickDisabled || kicksRemaining <= 0) return; audio.unlock(); e.currentTarget.setPointerCapture(e.pointerId); controls.kick = true; controls.kickRequested = true; }} onPointerUp={() => { controls.kick = false; }} onPointerCancel={() => { controls.kick = false; }} onLostPointerCapture={() => { controls.kick = false; }} onKeyDown={e => { if (e.key === 'Enter' && !controls.kickDisabled && kicksRemaining > 0) { audio.unlock(); controls.kick = true; controls.kickRequested = true; } }} onKeyUp={() => { controls.kick = false; }} onBlur={() => { controls.kick = false; }}><Crosshair /><span>KICK {kicksRemaining}</span></button><span className="control-hint"><kbd>SPACE</kbd></span></>}</div>}
    </div>
  </div>;
}
