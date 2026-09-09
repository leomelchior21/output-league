import { useState } from 'react';
import { ArrowRight, Play, Terminal } from 'lucide-react';
import Modal from './Modal';
import type { Language } from '../data/levels';
import { HighlightedCode } from './HighlightedCode';

export function CodeDemo({ language = 'python', code = ['print("GO!")', 'print(24)'], output = ['GO!', '24'] }: { language?: Language; code?: string[]; output?: string[] }) {
  const [execution, setExecution] = useState(0);
  return <div className="code-demo">
    <div className="demo-editor"><span className="eyebrow"><Terminal size={13} /> {language === 'csharp' ? 'C#' : language.toUpperCase()}</span>{code.map((line, i) => <div key={i}><span>{i + 1}</span><code><HighlightedCode line={line} /></code></div>)}</div>
    <button className="demo-run" onClick={() => setExecution(n => n + 1)} aria-label="Run example"><Play size={15} fill="currentColor" /> RUN CODE <ArrowRight size={15} /></button>
    <div className="demo-terminal" aria-live="polite"><span className="eyebrow">OUTPUT</span>{execution ? <div key={execution}>{output.map((line, i) => <code className="demo-output" style={{ animationDelay: `${i * 420}ms` }} key={i}>{line}</code>)}</div> : <span className="demo-prompt">Press RUN CODE to see what happens<span className="terminal-cursor">_</span></span>}</div>
  </div>;
}
const recaps = {
  1: { label: 'PRINT learning recap', title: <>You can read <span className="cyan-text">print().</span></>, intro: 'One small command. A new way to make code speak.', points: [['Values appear on screen.', 'Numbers keep their value; text keeps its spelling and punctuation.'], ['Quotes stay in the code.', 'They mark text, but are not part of its output.'], ['Order matters.', 'Each print runs from top to bottom, on a new line.']] },
  2: { label: 'SIMPLE VARIABLES learning recap', title: <>You can retrieve <span className="cyan-text">stored values.</span></>, intro: 'A variable name gives a value a place in memory.', points: [['Names point to values.', 'Printing a variable retrieves what it stores.'], ['Text and names differ.', 'Quotes make literal text instead of a variable lookup.'], ['Choose the requested variable.', 'Other stored values do not change the output.']] },
  3: { label: 'RETRIEVING DATA learning recap', title: <>You can track <span className="cyan-text">current state.</span></>, intro: 'Assignments update memory as Python runs.', points: [['Latest assignments win.', 'A new assignment replaces the old stored value.'], ['Copies keep their value.', 'Changing the source later does not update an earlier copy.'], ['Order matters.', 'Track each assignment from top to bottom.']] },
  4: { label: 'BASIC OPERATIONS learning recap', title: <>You can execute <span className="cyan-text">basic operations.</span></>, intro: 'Calculate each line, then store its result.', points: [['Use current values.', 'Retrieve values before applying +, -, *, or /.'], ['Updates store results.', 'The value on the right is calculated before the name on the left changes.'], ['Division can be decimal.', 'Python / prints values such as 5.0.']] },
};
export default function LearningCard({ language = 'python', levelId = 1, onContinue, code, output }: { language?: Language; levelId?: number; onContinue: () => void; code: string[]; output: string[] }) {
  const recap = recaps[levelId as keyof typeof recaps] ?? recaps[1];
  const displayName = language === 'csharp' ? 'C#' : language.toUpperCase();
  const points = levelId === 4 && language !== 'python'
    ? recap.points.map((point, index) => index === 2 ? ['Integer division.', `${displayName} divides two stored integers without a decimal, so 5 / 2 is 2.`] : point)
    : recap.points;
  return <Modal label={recap.label} className={`learning-modal lang-${language}`}><span className="eyebrow success-text">KNOWLEDGE UNLOCKED · {displayName} {String(levelId).padStart(2, '0')}</span><h2>{recap.title}</h2><p>{recap.intro.replace('Python', displayName)}</p><CodeDemo language={language} code={code} output={output} /><div className="lesson-takeaways">{points.map(([title, detail]) => <p key={title}><b>{title}</b> {detail}</p>)}</div><button className="primary-button" onClick={onContinue}>SEE MY SCORE <ArrowRight size={20} /></button></Modal>;
}
