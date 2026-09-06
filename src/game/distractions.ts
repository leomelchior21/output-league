/** A visible warning, three-second cameo, and a generous quiet interval. */
export function tricksterPhase(time: number): 'quiet' | 'warning' | 'active' {
  const phase = time % 16;
  return phase < 6 || phase >= 10 ? 'quiet' : phase < 7 ? 'warning' : 'active';
}
