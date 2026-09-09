import { Fragment } from 'react';

const tokenPattern = /("(?:[^"\\]|\\.)*"|Console\.WriteLine|\b(?:print|int|string|var)\b|-?\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b)/g;
const wholeTokenPattern = /^(?:"(?:[^"\\]|\\.)*"|Console\.WriteLine|print|int|string|var|-?\d+(?:\.\d+)?|[A-Za-z_]\w*)$/;

function tokenClass(token: string) {
  if (token.startsWith('"')) return 'string';
  if (token === 'Console.WriteLine' || token === 'print') return 'function';
  if (token === 'int' || token === 'string' || token === 'var') return 'keyword';
  if (/^-?\d/.test(token)) return 'number';
  return 'variable';
}

export function HighlightedCode({ line }: { line: string }) {
  const parts = line.split(tokenPattern);
  return <>{parts.map((part, index) => part && wholeTokenPattern.test(part)
    ? <span className={tokenClass(part)} key={index}>{part}</span>
    : <Fragment key={index}>{part}</Fragment>)}</>;
}

export const isOutputStatement = (line: string) => /^(?:print|Console\.WriteLine)\s*\(/.test(line.trim());
