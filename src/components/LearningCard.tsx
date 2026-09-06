import { useState } from 'react';
import { ArrowRight, Play, Terminal } from 'lucide-react';
import Modal from './Modal';

export function CodeDemo({ code = ['print("GO!")', 'print(24)'], output = ['GO!', '24'] }: { code?: string[]; output?: string[] }) {
  const [execution, setExecution] = useState(0);
  return <div className="code-demo">
    <div className="demo-editor"><span className="eyebrow"><Terminal size={13} /> PYTHON</span>{code.map((line, i) => <div key={i}><span>{i + 1}</span><code>{line}</code></div>)}</div>
    <button className="demo-run" onClick={() => setExecution(n => n + 1)} aria-label="Run example"><Play size={15} fill="currentColor" /> RUN CODE <ArrowRight size={15} /></button>
    <div className="demo-terminal" aria-live="polite"><span className="eyebrow">OUTPUT</span>{execution ? <div key={execution}>{output.map((line, i) => <code className="demo-output" style={{ animationDelay: `${i * 420}ms` }} key={i}>{line}</code>)}</div> : <span className="demo-prompt">Press RUN CODE to see what happens<span className="terminal-cursor">_</span></span>}</div>
  </div>;
}
export default function LearningCard({ onContinue, code, output }: { onContinue: () => void; code: string[]; output: string[] }) {
  return <Modal label="PRINT learning recap" className="learning-modal"><span className="eyebrow success-text">KNOWLEDGE UNLOCKED · PYTHON 01</span><h2>You can read <span className="cyan-text">print().</span></h2><p>One small command. A new way to make code speak.</p><CodeDemo code={code} output={output} /><div className="lesson-takeaways"><p><b>Values appear on screen.</b> Numbers keep their value; text keeps its spelling and punctuation.</p><p><b>Quotes stay in the code.</b> They mark text, but are not part of its output.</p><p><b>Order matters.</b> Each print runs from top to bottom, on a new line.</p></div><button className="primary-button" onClick={onContinue}>SEE MY SCORE <ArrowRight size={20} /></button></Modal>;
}
