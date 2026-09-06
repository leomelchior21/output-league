import { useRef, useState, type PointerEvent } from 'react';
import { ChevronsUp, Crosshair } from 'lucide-react';
import type { Controls as ControlState } from '../game/ArenaScene';
import type { GameAudio } from '../game/audio';
export default function Controls({ controls, audio, kicksRemaining, kickHidden = false }: { controls: ControlState; audio: GameAudio; kicksRemaining: number; kickHidden?: boolean }) {
  const pointer = useRef<number | null>(null); const [knob, setKnob] = useState({ x: 0, y: 0 });
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (pointer.current !== e.pointerId) return;
    const rect = e.currentTarget.getBoundingClientRect(), radius = rect.width * .29;
    const dx = e.clientX - rect.left - rect.width / 2, dy = e.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(dx, dy), scale = distance > radius ? radius / distance : 1;
    const x = dx * scale, y = dy * scale;
    controls.x = x / radius; controls.y = y / radius; setKnob({ x, y });
  };
  const reset = () => { pointer.current = null; controls.x = 0; controls.y = 0; setKnob({ x: 0, y: 0 }); };
  return <div className="controls-layer">
    <div className="joystick-wrap"><div className="joystick" role="group" aria-label="Analog steering joystick. Drag to steer. Keyboard: WASD or arrow keys." onPointerDown={e => { if (pointer.current !== null) return; audio.unlock(); pointer.current = e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={move} onPointerUp={reset} onPointerCancel={reset} onLostPointerCapture={reset}>
      <i className="joystick-north" /><i className="joystick-east" /><i className="joystick-south" /><i className="joystick-west" /><div className="joystick-ring" /><div className="joystick-knob" style={{ transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div><span className="control-hint">DRIVE <kbd>W A S D</kbd></span></div>
    <div className="action-controls"><div><button className="action-button boost-button" aria-label="Boost. Hold Shift on keyboard." onPointerDown={e => { audio.unlock(); e.currentTarget.setPointerCapture(e.pointerId); controls.boost = true; }} onPointerUp={() => { controls.boost = false; }} onPointerCancel={() => { controls.boost = false; }} onLostPointerCapture={() => { controls.boost = false; }} onKeyDown={e => { if (e.key === 'Enter') { audio.unlock(); controls.boost = true; } }} onKeyUp={() => { controls.boost = false; }} onBlur={() => { controls.boost = false; }}><ChevronsUp /><span>BOOST</span></button><span className="control-hint"><kbd>SHIFT</kbd></span></div>
      {!kickHidden && <div><button className="action-button kick-button" disabled={controls.kickDisabled || kicksRemaining <= 0} aria-label={`Kick. ${kicksRemaining} remaining this round. Press Space on keyboard.`} onPointerDown={e => { if (controls.kickDisabled || kicksRemaining <= 0) return; audio.unlock(); e.currentTarget.setPointerCapture(e.pointerId); controls.kick = true; controls.kickRequested = true; }} onPointerUp={() => { controls.kick = false; }} onPointerCancel={() => { controls.kick = false; }} onLostPointerCapture={() => { controls.kick = false; }} onKeyDown={e => { if (e.key === 'Enter' && !controls.kickDisabled && kicksRemaining > 0) { audio.unlock(); controls.kick = true; controls.kickRequested = true; } }} onKeyUp={() => { controls.kick = false; }} onBlur={() => { controls.kick = false; }}><Crosshair /><span>KICK {kicksRemaining}</span></button><span className="control-hint"><kbd>SPACE</kbd></span></div>}
    </div>
  </div>;
}
