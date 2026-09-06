import { useId } from 'react';
import { ConceptIcon } from './Icons';
import type { Level } from '../data/levels';
export default function Island({ level }: { level: Level }) {
  const id = useId().replaceAll(':', ''); const active = !level.locked;
  return <div className={`island-art ${active ? 'island-active' : ''}`} aria-hidden="true">
    <svg viewBox="0 0 260 170" className="island-terrain">
      <defs><linearGradient id={`rock${id}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={active ? '#244b60' : '#25364d'} /><stop offset="1" stopColor="#0a172b" /></linearGradient><linearGradient id={`top${id}`}><stop stopColor={active ? '#387e73' : '#3b4c65'} /><stop offset="1" stopColor={active ? '#205354' : '#25384f'} /></linearGradient></defs>
      <ellipse cx="130" cy="153" rx="88" ry="12" fill={active ? '#23bfd9' : '#3b78ae'} opacity=".1" />
      <path d="M24 75 58 116 76 126 84 147 109 145 130 160 158 144 186 147 190 126 216 114 236 73Z" fill={`url(#rock${id})`} stroke="#426177" strokeOpacity=".5" />
      <path d="m58 90 7 35 19 22 2-48M108 106l1 39 21 15 5-51m51-14v52l-28-3 3-40m55-17-8 37" fill="none" stroke="#477184" strokeWidth="3" opacity=".35" />
      <path d="m24 75 41-36 69-15 72 24 30 25-27 34-70 20-72-19Z" fill={`url(#top${id})`} stroke={active ? '#66e3c4' : '#61788a'} strokeWidth="2" />
      <path d="m24 75 43 33 72 19 70-20 27-34v9l-26 36-71 20-74-21-41-34Z" fill={active ? '#38bda1' : '#526078'} opacity={active ? '.75' : '.45'} />
      <path d="m46 76 31-24 57-14 57 19 23 17-18 24-57 17-60-15Z" fill="none" stroke={active ? '#a0efd7' : '#8facc2'} strokeOpacity=".23" />
      <path d="m79 86 53-21 58 23-54 20Z" fill="#07182b" opacity=".25" />
      {[{x:51,y:63},{x:204,y:75},{x:185,y:48},{x:74,y:44}].map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y})`}><path d="M-2 0h4v14h-4z" fill="#3c4349"/><path d="M0-32-14-6h7L-17 6h34L7-6h7Z" fill={active ? (i%2 ? '#65aa72' : '#267b62') : '#344e59'}/><path d="M0-32V6h17L7-6h7Z" fill="#122b38" opacity=".3"/></g>)}
      <path d="m43 99 10 4v24l-4 10-6-6Z" fill="#6cd7f5" opacity={active ? '.6' : '.18'} />
      <path d="m166 131 10-3v15l-5 14-5-4Z" fill="#6cd7f5" opacity={active ? '.45' : '.12'} />
    </svg>
    <div className="island-terminal"><ConceptIcon name={level.icon} size={active ? 36 : 31} />{active && <span>print<span className="string">("HELLO")</span></span>}</div>
  </div>;
}
