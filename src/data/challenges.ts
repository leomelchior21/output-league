export type ObstacleKind = 'wall' | 'moving-wall' | 'bumper' | 'disappearing-wall' | 'rotating-arm' | 'speed-pad' | 'slow-zone' | 'orbiting-bumper' | 'pothole';
export interface Challenge { id: string; category: string; code: string[]; outputs: string[]; choices: string[]; goals: 4 | 6; obstacles: ObstacleKind[]; bot?: boolean; orbit?: boolean; lesson: string }
export const challengeBank: Challenge[] = [
  { id: 'integer-8', category: 'INTEGER OUTPUT', code: ['print(8)'], outputs: ['8'], choices: ['8', '"8"', '0', 'ERROR'], goals: 4, obstacles: [], lesson: 'print() sends a value to the screen.' },
  { id: 'hello', category: 'STRING OUTPUT', code: ['print("HELLO")'], outputs: ['HELLO'], choices: ['HELLO', '"HELLO"', 'print', 'None'], goals: 4, obstacles: [], lesson: 'Quotes tell Python it is text. The quotes are not printed.' },
  { id: 'integer-12', category: 'SIX GOALS', code: ['print(12)'], outputs: ['12'], choices: ['12', '"12"', '1 2', '0', 'print', 'ERROR'], goals: 6, obstacles: ['bumper'], lesson: 'Same idea. A bigger arena of possibilities.' },
  { id: 'python', category: 'STRING OUTPUT', code: ['print("PYTHON")'], outputs: ['PYTHON'], choices: ['PYTHON', '"PYTHON"', 'python', 'print', 'None', 'ERROR'], goals: 6, obstacles: ['wall'], lesson: 'Python prints text exactly as written inside the quotes.' },
  { id: 'integer-25', category: 'MOVING WALL', code: ['print(25)'], outputs: ['25'], choices: ['25', '"25"', '2 5', '0', 'print', 'ERROR'], goals: 6, obstacles: ['moving-wall'], lesson: 'Find your line around the moving barrier.' },
  { id: 'punctuation', category: 'PUNCTUATION', code: ['print("GO!")'], outputs: ['GO!'], choices: ['GO!', 'GO', '"GO!"', 'go!', 'None', 'ERROR'], goals: 6, obstacles: ['bumper'], lesson: 'Punctuation inside the quotes is part of the output.' },
  { id: 'integer-9', category: 'SHARED ARENA', code: ['print(9)'], outputs: ['9'], choices: ['9', '"9"', '0', '6', 'None', 'ERROR'], goals: 6, obstacles: [], bot: true, lesson: 'A little company. Keep your eyes on your output.' },
  { id: 'orbit-code', category: 'ORBIT MODE', code: ['print("CODE")'], outputs: ['CODE'], choices: ['CODE', '"CODE"', 'code', 'None'], goals: 4, obstacles: [], orbit: true, lesson: 'Four moving goals. Plan your shot. Special round: +40 XP.' },
  { id: 'zero', category: 'ZERO', code: ['print(0)'], outputs: ['0'], choices: ['0', '"0"', 'None', 'False', 'print', 'ERROR'], goals: 6, obstacles: ['bumper', 'disappearing-wall'], bot: true, lesson: 'Zero is a value. It still gets printed.' },
  { id: 'mastery', category: 'MASTERY ROUND', code: ['print("GO")', 'print(7)'], outputs: ['GO', '7'], choices: ['GO', '7', '"GO"', '"7"', 'GO7', 'ERROR'], goals: 6, obstacles: ['wall'], lesson: 'Python runs from top to bottom. Score each output in order.' },
  { id: 'negative', category: 'NEGATIVE NUMBER', code: ['print(-4)'], outputs: ['-4'], choices: ['-4', '4', '"-4"', '0', 'None', 'ERROR'], goals: 6, obstacles: ['bumper', 'disappearing-wall'], bot: true, lesson: 'The minus sign is part of a negative number.' },
];
export function makeRounds(random = Math.random): Challenge[] {
  const rounds = challengeBank.slice(0, 10).map(c => ({ ...c, choices: [...c.choices], obstacles: [...c.obstacles] }));
  if (random() > 0.5) rounds[8] = { ...challengeBank[10], choices: [...challengeBank[10].choices] };
  const pick = <T,>(items: T[]) => items[Math.min(items.length - 1, Math.floor(random() * items.length))];
  const integer = (min: number, max: number) => min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
  const numberRound = (index: number, n: number) => {
    const c = rounds[index], s = String(n); c.code = [`print(${s})`]; c.outputs = [s];
    c.choices = c.goals === 4 ? [s, `"${s}"`, '0', 'ERROR'] : [s, `"${s}"`, n < 0 ? String(-n) : s.length > 1 ? s.split('').join(' ') : String(n + 1), n === 0 ? 'False' : '0', 'None', 'ERROR'];
    if (n === 0) c.choices = ['0', '"0"', 'None', 'False', 'print', 'ERROR'];
  };
  const textRound = (index: number, word: string) => {
    const c = rounds[index]; c.code = [`print("${word}")`]; c.outputs = [word];
    c.choices = c.goals === 4 ? [word, `"${word}"`, 'print', 'None'] : [word, `"${word}"`, word.toLowerCase(), word.endsWith('!') ? word.slice(0, -1) : 'print', 'None', 'ERROR'];
  };
  numberRound(0, integer(2, 9)); textRound(1, pick(['HELLO', 'READY', 'PLAY', 'HI']));
  const secondTargetSlot = 1 + Math.min(2, Math.floor(random() * 3));
  [rounds[1].choices[0], rounds[1].choices[secondTargetSlot]] = [rounds[1].choices[secondTargetSlot], rounds[1].choices[0]];
  numberRound(2, integer(12, 48)); textRound(3, pick(['PYTHON', 'ROVER', 'TURBO', 'NEON']));
  numberRound(4, integer(21, 89)); textRound(5, pick(['GO!', 'YES!', 'SCORE!', 'WOW!']));
  numberRound(6, integer(2, 9)); textRound(7, pick(['CODE', 'DRIVE', 'LOOP', 'BOOST']));
  numberRound(8, rounds[8].id === 'negative' ? -integer(2, 9) : 0);
  const word = pick(['GO', 'WIN', 'PLAY', 'NICE']), n = String(integer(2, 9));
  rounds[9].code = [`print("${word}")`, `print(${n})`]; rounds[9].outputs = [word, n];
  rounds[9].choices = [word, n, `"${word}"`, `"${n}"`, word + n, 'ERROR'];
  rounds[4].obstacles = ['moving-wall', 'wall', 'bumper', 'slow-zone'];
  rounds[5].obstacles = ['bumper', 'rotating-arm', 'disappearing-wall', 'speed-pad', 'pothole'];
  rounds[6].obstacles = ['moving-wall', 'bumper', 'rotating-arm', 'slow-zone', 'pothole', 'disappearing-wall'];
  rounds[6].lesson = 'A portal rover borrows the ball briefly, then disappears. Keep your eyes on your output.';
  rounds[7].obstacles = ['orbiting-bumper', 'rotating-arm', 'disappearing-wall', 'bumper', 'moving-wall', 'pothole'];
  rounds[8].obstacles = ['bumper', 'disappearing-wall', 'moving-wall', 'rotating-arm', 'pothole', 'slow-zone', 'speed-pad'];
  rounds[8].lesson += ' Watch the amber rings: repair pits gently pop you back out.';
  rounds[9].obstacles = ['wall', 'moving-wall', 'bumper', 'disappearing-wall', 'rotating-arm', 'pothole', 'orbiting-bumper', 'bumper'];
  for (const round of rounds.slice(4)) round.bot = true;
  for (let r = 2; r < rounds.length; r++) {
    for (let i = rounds[r].choices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [rounds[r].choices[i], rounds[r].choices[j]] = [rounds[r].choices[j], rounds[r].choices[i]];
    }
  }
  return rounds;
}
