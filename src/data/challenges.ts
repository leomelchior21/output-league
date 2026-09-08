export type ObstacleKind = 'wall' | 'moving-wall' | 'bumper' | 'disappearing-wall' | 'rotating-arm' | 'speed-pad' | 'slow-zone' | 'orbiting-bumper' | 'pothole';
export interface Challenge { id: string; category: string; code: string[]; outputs: string[]; choices: string[]; goals: 4 | 6; obstacles: ObstacleKind[]; bot?: boolean; orbit?: boolean; mastery?: boolean; graceSeconds?: number; lesson: string }
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

const level2Rounds: Challenge[] = [
  { id: 'variables-number', category: 'STORED NUMBER', code: ['x = 6', 'print(x)'], outputs: ['6'], choices: ['6', 'x', '"6"', '0'], goals: 4, obstacles: [], graceSeconds: 6, lesson: 'A variable name points to the value stored inside it.' },
  { id: 'variables-string', category: 'STORED TEXT', code: ['name = "Luna"', 'print(name)'], outputs: ['Luna'], choices: ['Luna', '"Luna"', 'name', 'None'], goals: 4, obstacles: [], graceSeconds: 6, lesson: 'Printing a variable shows its stored text without quotes.' },
  { id: 'variables-score', category: 'SIX GOALS', code: ['score = 20', 'print(score)'], outputs: ['20'], choices: ['20', 'score', '"20"', '2', '0', 'ERROR'], goals: 6, obstacles: ['bumper'], graceSeconds: 4, lesson: 'Read the variable name, then retrieve the value it stores.' },
  { id: 'variables-lives', category: 'STATIC WALL', code: ['lives = 3', 'print(lives)'], outputs: ['3'], choices: ['3', 'lives', '"3"', '0', 'None', 'ERROR'], goals: 6, obstacles: ['wall'], graceSeconds: 4, lesson: 'The wall changes your route, not the value in memory.' },
  { id: 'variables-two', category: 'TWO VARIABLES', code: ['x = 5', 'y = 9', 'print(y)'], outputs: ['9'], choices: ['5', '9', 'y', '"y"', '14', '0'], goals: 6, obstacles: ['bumper'], graceSeconds: 6, lesson: 'Follow the variable named inside print().' },
  { id: 'variables-mixed', category: 'MIXED VALUES', code: ['player = "Nova"', 'score = 10', 'print(player)'], outputs: ['Nova'], choices: ['Nova', '"Nova"', 'player', '10', 'score', 'ERROR'], goals: 6, obstacles: ['moving-wall', 'bumper', 'speed-pad'], graceSeconds: 4, lesson: 'Variables can store text or numbers independently.' },
  { id: 'variables-literal', category: 'VARIABLE OR TEXT?', code: ['score = 12', 'print("score")'], outputs: ['score'], choices: ['score', '12', '"score"', '0', 'None', 'ERROR'], goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], bot: true, graceSeconds: 5, lesson: 'Quotes make score literal text, so Python does not retrieve the variable.' },
  { id: 'variables-orbit', category: 'ORBIT MODE', code: ['code = "PY"', 'print(code)'], outputs: ['PY'], choices: ['PY', '"PY"', 'code', 'None'], goals: 4, obstacles: ['bumper', 'orbiting-bumper'], orbit: true, graceSeconds: 5, lesson: 'The code is simple; time your approach to the moving output.' },
  { id: 'variables-three', category: 'CHALLENGE ROUND', code: ['name = "Kai"', 'age = 13', 'score = 8', 'print(age)'], outputs: ['13'], choices: ['13', '8', 'Kai', 'age', '"age"', '21'], goals: 6, obstacles: ['bumper', 'moving-wall', 'disappearing-wall', 'speed-pad'], bot: true, graceSeconds: 5, lesson: 'Ignore unrelated variables and retrieve only age.' },
  { id: 'variables-mastery', category: 'MASTERY ROUND', code: ['name = "Ada"', 'score = 12', 'print(name)', 'print(score)'], outputs: ['Ada', '12'], choices: ['Ada', '12', 'name', 'score', '"Ada"', '24'], goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], mastery: true, graceSeconds: 6, lesson: 'Run the program from top to bottom and score both outputs in order.' },
];

const level3Rounds: Challenge[] = [
  { id: 'retrieve-reassign', category: 'NEW VALUE', code: ['x = 3', 'x = 7', 'print(x)'], outputs: ['7'], choices: ['3', '7', '10', 'x'], goals: 4, obstacles: [], graceSeconds: 6, lesson: 'A later assignment replaces the value stored in x.' },
  { id: 'retrieve-latest', category: 'CURRENT STATE', code: ['score = 4', 'score = 9', 'score = 12', 'print(score)'], outputs: ['12'], choices: ['4', '9', '12', 'score'], goals: 4, obstacles: [], graceSeconds: 6, lesson: 'The current value is the most recently assigned value.' },
  { id: 'retrieve-copy', category: 'COPY A VALUE', code: ['x = 5', 'y = x', 'print(y)'], outputs: ['5'], choices: ['x', 'y', '5', '0', 'ERROR', '10'], goals: 6, obstacles: [], graceSeconds: 5, lesson: 'y receives the value currently stored in x.' },
  { id: 'retrieve-snapshot', category: 'VALUE SNAPSHOT', code: ['x = 4', 'y = x', 'x = 9', 'print(y)'], outputs: ['4'], choices: ['4', '9', 'x', 'y', '13', 'ERROR'], goals: 6, obstacles: [], graceSeconds: 6, lesson: 'Changing x later does not change the value already copied into y.' },
  { id: 'retrieve-saved', category: 'SAVED VALUE', code: ['coins = 3', 'saved = coins', 'print(saved)'], outputs: ['3'], choices: ['3', 'coins', 'saved', '0', '6', 'ERROR'], goals: 6, obstacles: ['bumper', 'wall'], graceSeconds: 4, lesson: 'saved stores a copy of coins at that moment.' },
  { id: 'retrieve-saved-later', category: 'TRACK THE COPY', code: ['coins = 3', 'saved = coins', 'coins = 8', 'print(saved)'], outputs: ['3'], choices: ['3', '8', '11', 'coins', 'saved', '0'], goals: 6, obstacles: ['moving-wall', 'bumper', 'speed-pad'], graceSeconds: 5, lesson: 'The moving wall changes; the copied value does not.' },
  { id: 'retrieve-chain', category: 'COPY CHAIN', code: ['a = 6', 'b = a', 'c = b', 'print(c)'], outputs: ['6'], choices: ['6', 'a', 'b', 'c', '0', 'ERROR'], goals: 6, obstacles: ['bumper', 'moving-wall', 'rotating-arm'], bot: true, graceSeconds: 5, lesson: 'Values can be copied through a chain of variables.' },
  { id: 'retrieve-orbit', category: 'ORBIT MODE', code: ['x = 2', 'y = x', 'print(y)'], outputs: ['2'], choices: ['2', 'x', 'y', '0'], goals: 4, obstacles: ['bumper', 'orbiting-bumper'], orbit: true, graceSeconds: 5, lesson: 'Track the copied value, then track the moving goal.' },
  { id: 'retrieve-challenge', category: 'CHALLENGE ROUND', code: ['x = 2', 'y = x', 'x = 5', 'z = y', 'print(z)'], outputs: ['2'], choices: ['2', '5', '7', 'x', 'y', 'z'], goals: 6, obstacles: ['bumper', 'disappearing-wall', 'moving-wall', 'speed-pad'], bot: true, graceSeconds: 5, lesson: 'z receives y, which still stores the original value 2.' },
  { id: 'retrieve-mastery', category: 'MASTERY ROUND', code: ['x = 3', 'y = x', 'x = 9', 'print(x)', 'print(y)'], outputs: ['9', '3'], choices: ['9', '3', 'x', 'y', '12', 'ERROR'], goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], mastery: true, graceSeconds: 6, lesson: 'Track both current states and score the outputs in order.' },
];

const level4Rounds: Challenge[] = [
  { id: 'operations-add', category: 'ADDITION', code: ['x = 5', 'x = x + 3', 'print(x)'], outputs: ['8'], choices: ['5', '3', '8', '15'], goals: 4, obstacles: [], graceSeconds: 6, lesson: 'Take the current value, add 3, and store the result back in x.' },
  { id: 'operations-subtract', category: 'SUBTRACTION', code: ['energy = 10', 'energy = energy - 4', 'print(energy)'], outputs: ['6'], choices: ['10', '4', '6', '14'], goals: 4, obstacles: [], graceSeconds: 6, lesson: 'Subtraction updates energy from 10 to 6.' },
  { id: 'operations-multiply', category: 'MULTIPLICATION', code: ['coins = 3', 'coins = coins * 4', 'print(coins)'], outputs: ['12'], choices: ['12', '7', '3', '4', '9', '1'], goals: 6, obstacles: ['bumper'], graceSeconds: 5, lesson: 'Multiplication stores 3 times 4 back in coins.' },
  { id: 'operations-divide', category: 'DIVISION', code: ['energy = 20', 'energy = energy / 4', 'print(energy)'], outputs: ['5.0'], choices: ['5.0', '5', '16', '24', '80', '4'], goals: 6, obstacles: [], graceSeconds: 6, lesson: 'In Python, / produces a decimal value: 5.0.' },
  { id: 'operations-update', category: 'UPDATE A VARIABLE', code: ['score = 5', 'score = score + 3', 'print(score)'], outputs: ['8'], choices: ['8', '5', '3', '15', 'score', '0'], goals: 6, obstacles: ['wall', 'bumper', 'speed-pad'], graceSeconds: 5, lesson: 'Use the old score, calculate the result, then store it back in score.' },
  { id: 'operations-two', category: 'TWO VARIABLES', code: ['red = 4', 'blue = 3', 'score = red + blue', 'print(score)'], outputs: ['7'], choices: ['7', '4', '3', '12', 'red', 'blue'], goals: 6, obstacles: ['moving-wall', 'bumper', 'rotating-arm'], graceSeconds: 5, lesson: 'Retrieve both stored values before adding them.' },
  { id: 'operations-sequence', category: 'OPERATION CHAIN', code: ['x = 5', 'x = x + 3', 'x = x * 2', 'print(x)'], outputs: ['16'], choices: ['16', '11', '8', '10', '30', '5'], goals: 6, obstacles: ['wall', 'bumper', 'disappearing-wall', 'slow-zone'], bot: true, graceSeconds: 5, lesson: 'Execute each update in order: 5, then 8, then 16.' },
  { id: 'operations-orbit', category: 'ORBIT MODE', code: ['x = 6', 'x = x * 2', 'print(x)'], outputs: ['12'], choices: ['12', '8', '6', '2'], goals: 4, obstacles: ['bumper', 'orbiting-bumper', 'speed-pad'], orbit: true, graceSeconds: 5, lesson: 'Easy multiplication meets synchronized moving goals.' },
  { id: 'operations-chaos', category: 'CHAOS ROUND', code: ['points = 10', 'bonus = 4', 'points = points + bonus', 'print(points)'], outputs: ['14'], choices: ['14', '10', '4', '40', '6', 'points'], goals: 6, obstacles: ['moving-wall', 'disappearing-wall', 'bumper', 'speed-pad', 'rotating-arm', 'pothole'], bot: true, graceSeconds: 5, lesson: 'Keep the calculation clear while the arena gets energetic.' },
  { id: 'operations-mastery', category: 'MASTERY ROUND', code: ['x = 4', 'y = 3', 'x = x + y', 'y = x * 2', 'x = y - 5', 'print(x)'], outputs: ['9'], choices: ['9', '7', '14', '5', '11', '2'], goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], mastery: true, graceSeconds: 6, lesson: 'Execute one line at a time: x becomes 7, y becomes 14, then x becomes 9.' },
];

function cloneRounds(rounds: Challenge[]) {
  return rounds.map(round => ({ ...round, code: [...round.code], outputs: [...round.outputs], choices: [...round.choices], obstacles: [...round.obstacles] }));
}

export function makeLevelRounds(levelId: number, random = Math.random): Challenge[] {
  if (levelId === 1) return makeRounds(random);
  const source = levelId === 2 ? level2Rounds : levelId === 3 ? level3Rounds : levelId === 4 ? level4Rounds : undefined;
  if (!source) return makeRounds(random);
  const rounds = cloneRounds(source);
  for (const round of rounds.slice(1)) {
    for (let i = round.choices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [round.choices[i], round.choices[j]] = [round.choices[j], round.choices[i]];
    }
  }
  return rounds;
}
