import type { Challenge } from './challenges';
import type { Language } from './levels';

type Content = [id: string, category: string, code: string[], outputs: string[], choices: string[], lesson: string];
type Arena = Pick<Challenge, 'goals' | 'obstacles'> & Partial<Pick<Challenge, 'bot' | 'orbit' | 'mastery' | 'graceSeconds'>>;

const arenaByLevel: Record<number, Arena[]> = {
  1: [
    { goals: 4, obstacles: [] },
    { goals: 4, obstacles: [] },
    { goals: 6, obstacles: ['bumper'] },
    { goals: 6, obstacles: ['wall'] },
    { goals: 6, obstacles: ['moving-wall', 'wall', 'bumper', 'slow-zone'], bot: true },
    { goals: 6, obstacles: ['bumper', 'rotating-arm', 'disappearing-wall', 'speed-pad', 'pothole'], bot: true },
    { goals: 6, obstacles: ['moving-wall', 'bumper', 'rotating-arm', 'slow-zone', 'pothole', 'disappearing-wall'], bot: true },
    { goals: 4, obstacles: ['orbiting-bumper', 'rotating-arm', 'disappearing-wall', 'bumper', 'moving-wall', 'pothole'], orbit: true, bot: true },
    { goals: 6, obstacles: ['bumper', 'disappearing-wall', 'moving-wall', 'rotating-arm', 'pothole', 'slow-zone', 'speed-pad'], bot: true },
    { goals: 6, obstacles: ['wall', 'moving-wall', 'bumper', 'disappearing-wall', 'rotating-arm', 'pothole', 'orbiting-bumper', 'bumper'], bot: true, mastery: true },
  ],
  2: [
    { goals: 4, obstacles: [], graceSeconds: 6 },
    { goals: 4, obstacles: [], graceSeconds: 6 },
    { goals: 6, obstacles: ['bumper'], graceSeconds: 4 },
    { goals: 6, obstacles: ['wall'], graceSeconds: 4 },
    { goals: 6, obstacles: ['bumper'], graceSeconds: 6 },
    { goals: 6, obstacles: ['moving-wall', 'bumper', 'speed-pad'], graceSeconds: 4 },
    { goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], bot: true, graceSeconds: 5 },
    { goals: 4, obstacles: ['bumper', 'orbiting-bumper'], orbit: true, graceSeconds: 5 },
    { goals: 6, obstacles: ['bumper', 'moving-wall', 'disappearing-wall', 'speed-pad'], bot: true, graceSeconds: 5 },
    { goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], mastery: true, graceSeconds: 6 },
  ],
  3: [
    { goals: 4, obstacles: [], graceSeconds: 6 },
    { goals: 4, obstacles: [], graceSeconds: 6 },
    { goals: 6, obstacles: [], graceSeconds: 5 },
    { goals: 6, obstacles: [], graceSeconds: 6 },
    { goals: 6, obstacles: ['bumper', 'wall'], graceSeconds: 4 },
    { goals: 6, obstacles: ['moving-wall', 'bumper', 'speed-pad'], graceSeconds: 5 },
    { goals: 6, obstacles: ['bumper', 'moving-wall', 'rotating-arm'], bot: true, graceSeconds: 5 },
    { goals: 4, obstacles: ['bumper', 'orbiting-bumper'], orbit: true, graceSeconds: 5 },
    { goals: 6, obstacles: ['bumper', 'disappearing-wall', 'moving-wall', 'speed-pad'], bot: true, graceSeconds: 5 },
    { goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], mastery: true, graceSeconds: 6 },
  ],
  4: [
    { goals: 4, obstacles: [], graceSeconds: 6 },
    { goals: 4, obstacles: [], graceSeconds: 6 },
    { goals: 6, obstacles: ['bumper'], graceSeconds: 5 },
    { goals: 6, obstacles: [], graceSeconds: 6 },
    { goals: 6, obstacles: ['wall', 'bumper', 'speed-pad'], graceSeconds: 5 },
    { goals: 6, obstacles: ['moving-wall', 'bumper', 'rotating-arm'], graceSeconds: 5 },
    { goals: 6, obstacles: ['wall', 'bumper', 'disappearing-wall', 'slow-zone'], bot: true, graceSeconds: 5 },
    { goals: 4, obstacles: ['bumper', 'orbiting-bumper', 'speed-pad'], orbit: true, graceSeconds: 5 },
    { goals: 6, obstacles: ['moving-wall', 'disappearing-wall', 'bumper', 'speed-pad', 'rotating-arm', 'pothole'], bot: true, graceSeconds: 5 },
    { goals: 6, obstacles: ['wall', 'bumper', 'slow-zone'], mastery: true, graceSeconds: 6 },
  ],
};

const csharp: Record<number, Content[]> = {
  1: [
    ['integer-8', 'INTEGER OUTPUT', ['Console.WriteLine(8);'], ['8'], ['8', '"8"', '0', 'ERROR'], 'Console.WriteLine sends a value to the console.'],
    ['hello', 'STRING OUTPUT', ['Console.WriteLine("HELLO");'], ['HELLO'], ['HELLO', '"HELLO"', 'Console', 'WriteLine'], 'Quotes mark text in C#, but are not part of its output.'],
    ['integer-12', 'SIX GOALS', ['Console.WriteLine(12);'], ['12'], ['12', '"12"', '1 2', '0', 'WriteLine', 'ERROR'], 'The semicolon ends the statement; it is not printed.'],
    ['code', 'STRING OUTPUT', ['Console.WriteLine("CODE");'], ['CODE'], ['CODE', '"CODE"', 'code', 'Console', 'WriteLine', 'ERROR'], 'C# prints the text exactly as written inside the quotes.'],
    ['integer-25', 'MOVING WALL', ['Console.WriteLine(25);'], ['25'], ['25', '"25"', '2 5', '0', 'Console', 'ERROR'], 'Read the value first, then find your line around the barrier.'],
    ['punctuation', 'PUNCTUATION', ['Console.WriteLine("GO!");'], ['GO!'], ['GO!', 'GO', '"GO!"', 'go!', 'WriteLine', 'ERROR'], 'Punctuation inside the quotes is part of the output.'],
    ['integer-9', 'SHARED ARENA', ['Console.WriteLine(9);'], ['9'], ['9', '"9"', '0', '6', 'Console', 'ERROR'], 'The portal rover does not know the answer. Keep reading the code.'],
    ['orbit-csharp', 'ORBIT MODE', ['Console.WriteLine("C#");'], ['C#'], ['C#', '"C#"', 'Console', 'ERROR'], 'Four moving goals. Time your approach to the C# output.'],
    ['zero', 'CHAOS ROUND', ['Console.WriteLine(0);'], ['0'], ['0', '"0"', 'Console', 'WriteLine', 'null', 'ERROR'], 'Zero is a value, and Console.WriteLine prints it.'],
    ['mastery', 'MASTERY ROUND', ['Console.WriteLine("GO");', 'Console.WriteLine(7);'], ['GO', '7'], ['GO', '7', '"GO"', '"7"', 'GO7', 'ERROR'], 'C# runs top to bottom. Score each output in order.'],
  ],
  2: [
    ['variables-number', 'STORED NUMBER', ['int x = 6;', 'Console.WriteLine(x);'], ['6'], ['6', 'x', 'int', '0'], 'int tells C# that x stores a whole number.'],
    ['variables-string', 'STORED TEXT', ['string name = "Luna";', 'Console.WriteLine(name);'], ['Luna'], ['Luna', '"Luna"', 'name', 'string'], 'string marks text; printing the variable leaves out the quotes.'],
    ['variables-score', 'SIX GOALS', ['int score = 20;', 'Console.WriteLine(score);'], ['20'], ['20', 'score', '"score"', 'int', '0', 'ERROR'], 'Follow score to the number stored inside it.'],
    ['variables-lives', 'STATIC WALL', ['int lives = 3;', 'Console.WriteLine(lives);'], ['3'], ['3', 'lives', '"3"', 'int', '0', 'ERROR'], 'The wall changes your route, not the stored value.'],
    ['variables-two', 'TWO VARIABLES', ['int x = 5;', 'int y = 9;', 'Console.WriteLine(y);'], ['9'], ['5', '9', 'y', 'int', '14', '0'], 'Print the variable named in Console.WriteLine.'],
    ['variables-mixed', 'MIXED VALUES', ['string player = "Nova";', 'int score = 10;', 'Console.WriteLine(player);'], ['Nova'], ['Nova', '"Nova"', 'player', '10', 'score', 'ERROR'], 'C# keeps the string and int values separate.'],
    ['variables-literal', 'VARIABLE OR TEXT?', ['int score = 12;', 'Console.WriteLine("score");'], ['score'], ['score', '12', '"score"', 'int', '0', 'ERROR'], 'Quotes make score literal text, not a variable lookup.'],
    ['variables-orbit', 'ORBIT MODE', ['string code = "C#";', 'Console.WriteLine(code);'], ['C#'], ['C#', '"C#"', 'code', 'string'], 'Retrieve the stored text, then track its moving goal.'],
    ['variables-three', 'CHALLENGE ROUND', ['string name = "Kai";', 'int age = 13;', 'int score = 8;', 'Console.WriteLine(age);'], ['13'], ['13', '8', 'Kai', 'age', 'score', '21'], 'Ignore unrelated variables and retrieve only age.'],
    ['variables-mastery', 'MASTERY ROUND', ['string name = "Ada";', 'int score = 12;', 'Console.WriteLine(name);', 'Console.WriteLine(score);'], ['Ada', '12'], ['Ada', '12', 'name', 'score', '"Ada"', 'int'], 'Run the statements top to bottom and score both outputs in order.'],
  ],
  3: [
    ['retrieve-reassign', 'NEW VALUE', ['int x = 3;', 'x = 7;', 'Console.WriteLine(x);'], ['7'], ['3', '7', 'x', 'int'], 'A later assignment replaces the value stored in x.'],
    ['retrieve-latest', 'CURRENT STATE', ['int score = 4;', 'score = 9;', 'score = 12;', 'Console.WriteLine(score);'], ['12'], ['4', '9', '12', 'score'], 'The current value is the most recent assignment.'],
    ['retrieve-copy', 'COPY A VALUE', ['int x = 5;', 'int y = x;', 'Console.WriteLine(y);'], ['5'], ['x', 'y', '5', '0', 'int', 'ERROR'], 'y receives a copy of the value currently stored in x.'],
    ['retrieve-snapshot', 'VALUE SNAPSHOT', ['int x = 4;', 'int y = x;', 'x = 9;', 'Console.WriteLine(y);'], ['4'], ['4', '9', 'x', 'y', '13', 'ERROR'], 'Changing x later does not change the value already copied into y.'],
    ['retrieve-saved', 'SAVED VALUE', ['int coins = 3;', 'int saved = coins;', 'Console.WriteLine(saved);'], ['3'], ['3', 'coins', 'saved', 'int', '6', 'ERROR'], 'saved stores a copy of coins at that moment.'],
    ['retrieve-saved-later', 'TRACK THE COPY', ['int coins = 3;', 'int saved = coins;', 'coins = 8;', 'Console.WriteLine(saved);'], ['3'], ['3', '8', '11', 'coins', 'saved', '0'], 'The moving wall changes; the copied value does not.'],
    ['retrieve-chain', 'COPY CHAIN', ['int a = 6;', 'int b = a;', 'int c = b;', 'Console.WriteLine(c);'], ['6'], ['6', 'a', 'b', 'c', 'int', 'ERROR'], 'The value can travel through a chain of typed variables.'],
    ['retrieve-orbit', 'ORBIT MODE', ['int x = 2;', 'int y = x;', 'Console.WriteLine(y);'], ['2'], ['2', 'x', 'y', 'int'], 'Track the copied value, then track the moving goal.'],
    ['retrieve-challenge', 'CHALLENGE ROUND', ['int x = 2;', 'int y = x;', 'x = 5;', 'int z = y;', 'Console.WriteLine(z);'], ['2'], ['2', '5', '7', 'x', 'y', 'z'], 'z receives y, which still stores the original value 2.'],
    ['retrieve-mastery', 'MASTERY ROUND', ['int x = 3;', 'int y = x;', 'x = 9;', 'Console.WriteLine(x);', 'Console.WriteLine(y);'], ['9', '3'], ['9', '3', 'x', 'y', '12', 'ERROR'], 'Track both current values and score the outputs in order.'],
  ],
  4: [
    ['operations-add', 'ADDITION', ['int x = 5;', 'x = x + 3;', 'Console.WriteLine(x);'], ['8'], ['5', '3', '8', '15'], 'Add 3 to the current value and store the result back in x.'],
    ['operations-subtract', 'SUBTRACTION', ['int energy = 10;', 'energy = energy - 4;', 'Console.WriteLine(energy);'], ['6'], ['10', '4', '6', '14'], 'Subtraction updates energy from 10 to 6.'],
    ['operations-multiply', 'MULTIPLICATION', ['int coins = 3;', 'coins = coins * 4;', 'Console.WriteLine(coins);'], ['12'], ['12', '7', '3', '4', '9', '1'], 'Multiplication stores 3 times 4 back in coins.'],
    ['operations-divide', 'INTEGER DIVISION', ['int x = 5;', 'int y = 2;', 'Console.WriteLine(x / y);'], ['2'], ['2', '2.5', '5', '3', '10', 'ERROR'], 'Both values are int, so C# integer division produces 2.'],
    ['operations-update', 'UPDATE A VARIABLE', ['int score = 5;', 'score = score + 3;', 'Console.WriteLine(score);'], ['8'], ['8', '5', '3', '15', 'score', '0'], 'Calculate the right side before storing the new score.'],
    ['operations-two', 'TWO VARIABLES', ['int red = 4;', 'int blue = 3;', 'int score = red + blue;', 'Console.WriteLine(score);'], ['7'], ['7', '4', '3', '12', 'red', 'blue'], 'Retrieve both integer values before adding them.'],
    ['operations-sequence', 'OPERATION CHAIN', ['int x = 5;', 'x = x + 3;', 'x = x * 2;', 'Console.WriteLine(x);'], ['16'], ['16', '11', '8', '10', '30', '5'], 'Execute each update in order: 5, then 8, then 16.'],
    ['operations-orbit', 'ORBIT MODE', ['int x = 6;', 'x = x * 2;', 'Console.WriteLine(x);'], ['12'], ['12', '8', '6', '2'], 'Easy multiplication meets synchronized moving goals.'],
    ['operations-chaos', 'CHAOS ROUND', ['int points = 10;', 'int bonus = 4;', 'points = points + bonus;', 'Console.WriteLine(points);'], ['14'], ['14', '10', '4', '40', '6', 'points'], 'Keep the integer calculation clear while the arena gets energetic.'],
    ['operations-mastery', 'MASTERY ROUND', ['int x = 4;', 'int y = 3;', 'x = x + y;', 'y = x * 2;', 'x = y - 5;', 'Console.WriteLine(x);'], ['9'], ['9', '7', '14', '5', '11', '2'], 'Execute each statement: x becomes 7, y becomes 14, then x becomes 9.'],
  ],
};

const swift: Record<number, Content[]> = {
  1: [
    ['integer-8', 'INTEGER OUTPUT', ['print(8)'], ['8'], ['8', '"8"', '0', 'ERROR'], 'print sends a value to the console.'],
    ['hello', 'STRING OUTPUT', ['print("HELLO")'], ['HELLO'], ['HELLO', '"HELLO"', 'print', 'nil'], 'Quotes mark text in Swift, but are not part of its output.'],
    ['integer-12', 'SIX GOALS', ['print(12)'], ['12'], ['12', '"12"', '1 2', '0', 'print', 'ERROR'], 'The number inside print is the output.'],
    ['code', 'STRING OUTPUT', ['print("CODE")'], ['CODE'], ['CODE', '"CODE"', 'code', 'print', 'nil', 'ERROR'], 'Swift prints the text exactly as written inside the quotes.'],
    ['integer-25', 'MOVING WALL', ['print(25)'], ['25'], ['25', '"25"', '2 5', '0', 'print', 'ERROR'], 'Read the value first, then find your line around the barrier.'],
    ['punctuation', 'PUNCTUATION', ['print("GO!")'], ['GO!'], ['GO!', 'GO', '"GO!"', 'go!', 'nil', 'ERROR'], 'Punctuation inside the quotes is part of the output.'],
    ['integer-9', 'SHARED ARENA', ['print(9)'], ['9'], ['9', '"9"', '0', '6', 'nil', 'ERROR'], 'The portal rover does not know the answer. Keep reading the code.'],
    ['orbit-swift', 'ORBIT MODE', ['print("SWIFT")'], ['SWIFT'], ['SWIFT', '"SWIFT"', 'print', 'ERROR'], 'Four moving goals. Time your approach to the Swift output.'],
    ['zero', 'CHAOS ROUND', ['print(0)'], ['0'], ['0', '"0"', 'nil', 'false', 'print', 'ERROR'], 'Zero is a value, and print displays it.'],
    ['mastery', 'MASTERY ROUND', ['print("GO")', 'print(7)'], ['GO', '7'], ['GO', '7', '"GO"', '"7"', 'GO7', 'ERROR'], 'Swift runs top to bottom. Score each output in order.'],
  ],
  2: [
    ['variables-number', 'STORED NUMBER', ['var x = 6', 'print(x)'], ['6'], ['6', 'x', 'var', '0'], 'Swift infers that x stores a whole number.'],
    ['variables-string', 'STORED TEXT', ['var name = "Luna"', 'print(name)'], ['Luna'], ['Luna', '"Luna"', 'name', 'var'], 'Printing a stored text value leaves out the quotes.'],
    ['variables-score', 'SIX GOALS', ['var score = 20', 'print(score)'], ['20'], ['20', 'score', '"score"', 'var', '0', 'ERROR'], 'Follow score to the value stored inside it.'],
    ['variables-lives', 'STATIC WALL', ['var lives = 3', 'print(lives)'], ['3'], ['3', 'lives', '"3"', 'var', '0', 'ERROR'], 'The wall changes your route, not the stored value.'],
    ['variables-two', 'TWO VARIABLES', ['var x = 5', 'var y = 9', 'print(y)'], ['9'], ['5', '9', 'y', 'var', '14', '0'], 'Print the variable named inside print.'],
    ['variables-mixed', 'MIXED VALUES', ['var player = "Nova"', 'var score = 10', 'print(player)'], ['Nova'], ['Nova', '"Nova"', 'player', '10', 'score', 'ERROR'], 'Swift infers text and number types from their values.'],
    ['variables-literal', 'VARIABLE OR TEXT?', ['var score = 12', 'print("score")'], ['score'], ['score', '12', '"score"', 'var', '0', 'ERROR'], 'Quotes make score literal text, not a variable lookup.'],
    ['variables-orbit', 'ORBIT MODE', ['var code = "SWIFT"', 'print(code)'], ['SWIFT'], ['SWIFT', '"SWIFT"', 'code', 'var'], 'Retrieve the stored text, then track its moving goal.'],
    ['variables-three', 'CHALLENGE ROUND', ['var name = "Kai"', 'var age = 13', 'var score = 8', 'print(age)'], ['13'], ['13', '8', 'Kai', 'age', 'score', '21'], 'Ignore unrelated variables and retrieve only age.'],
    ['variables-mastery', 'MASTERY ROUND', ['var name = "Ada"', 'var score = 12', 'print(name)', 'print(score)'], ['Ada', '12'], ['Ada', '12', 'name', 'score', '"Ada"', 'var'], 'Run the statements top to bottom and score both outputs in order.'],
  ],
  3: [
    ['retrieve-reassign', 'NEW VALUE', ['var x = 3', 'x = 7', 'print(x)'], ['7'], ['3', '7', 'x', 'var'], 'A later assignment replaces the value stored in x.'],
    ['retrieve-latest', 'CURRENT STATE', ['var score = 4', 'score = 9', 'score = 12', 'print(score)'], ['12'], ['4', '9', '12', 'score'], 'The current value is the most recent assignment.'],
    ['retrieve-copy', 'COPY A VALUE', ['var x = 5', 'var y = x', 'print(y)'], ['5'], ['x', 'y', '5', '0', 'var', 'ERROR'], 'y receives a copy of the value currently stored in x.'],
    ['retrieve-snapshot', 'VALUE SNAPSHOT', ['var x = 4', 'var y = x', 'x = 9', 'print(y)'], ['4'], ['4', '9', 'x', 'y', '13', 'ERROR'], 'Changing x later does not change the value already copied into y.'],
    ['retrieve-saved', 'SAVED VALUE', ['var coins = 3', 'var saved = coins', 'print(saved)'], ['3'], ['3', 'coins', 'saved', 'var', '6', 'ERROR'], 'saved stores a copy of coins at that moment.'],
    ['retrieve-saved-later', 'TRACK THE COPY', ['var coins = 3', 'var saved = coins', 'coins = 8', 'print(saved)'], ['3'], ['3', '8', '11', 'coins', 'saved', '0'], 'The moving wall changes; the copied value does not.'],
    ['retrieve-chain', 'COPY CHAIN', ['var a = 6', 'var b = a', 'var c = b', 'print(c)'], ['6'], ['6', 'a', 'b', 'c', 'var', 'ERROR'], 'The value can travel through a chain of inferred variables.'],
    ['retrieve-orbit', 'ORBIT MODE', ['var x = 2', 'var y = x', 'print(y)'], ['2'], ['2', 'x', 'y', 'var'], 'Track the copied value, then track the moving goal.'],
    ['retrieve-challenge', 'CHALLENGE ROUND', ['var x = 2', 'var y = x', 'x = 5', 'var z = y', 'print(z)'], ['2'], ['2', '5', '7', 'x', 'y', 'z'], 'z receives y, which still stores the original value 2.'],
    ['retrieve-mastery', 'MASTERY ROUND', ['var x = 3', 'var y = x', 'x = 9', 'print(x)', 'print(y)'], ['9', '3'], ['9', '3', 'x', 'y', '12', 'ERROR'], 'Track both current values and score the outputs in order.'],
  ],
  4: [
    ['operations-add', 'ADDITION', ['var x = 5', 'x = x + 3', 'print(x)'], ['8'], ['5', '3', '8', '15'], 'Add 3 to the current value and store the result back in x.'],
    ['operations-subtract', 'SUBTRACTION', ['var energy = 10', 'energy = energy - 4', 'print(energy)'], ['6'], ['10', '4', '6', '14'], 'Subtraction updates energy from 10 to 6.'],
    ['operations-multiply', 'MULTIPLICATION', ['var coins = 3', 'coins = coins * 4', 'print(coins)'], ['12'], ['12', '7', '3', '4', '9', '1'], 'Multiplication stores 3 times 4 back in coins.'],
    ['operations-divide', 'INTEGER DIVISION', ['var x = 5', 'var y = 2', 'print(x / y)'], ['2'], ['2', '2.5', '5', '3', '10', 'ERROR'], 'Both values are Int, so Swift integer division produces 2.'],
    ['operations-update', 'UPDATE A VARIABLE', ['var score = 5', 'score = score + 3', 'print(score)'], ['8'], ['8', '5', '3', '15', 'score', '0'], 'Calculate the right side before storing the new score.'],
    ['operations-two', 'TWO VARIABLES', ['var red = 4', 'var blue = 3', 'var score = red + blue', 'print(score)'], ['7'], ['7', '4', '3', '12', 'red', 'blue'], 'Retrieve both integer values before adding them.'],
    ['operations-sequence', 'OPERATION CHAIN', ['var x = 5', 'x = x + 3', 'x = x * 2', 'print(x)'], ['16'], ['16', '11', '8', '10', '30', '5'], 'Execute each update in order: 5, then 8, then 16.'],
    ['operations-orbit', 'ORBIT MODE', ['var x = 6', 'x = x * 2', 'print(x)'], ['12'], ['12', '8', '6', '2'], 'Easy multiplication meets synchronized moving goals.'],
    ['operations-chaos', 'CHAOS ROUND', ['var points = 10', 'var bonus = 4', 'points = points + bonus', 'print(points)'], ['14'], ['14', '10', '4', '40', '6', 'points'], 'Keep the integer calculation clear while the arena gets energetic.'],
    ['operations-mastery', 'MASTERY ROUND', ['var x = 4', 'var y = 3', 'x = x + y', 'y = x * 2', 'x = y - 5', 'print(x)'], ['9'], ['9', '7', '14', '5', '11', '2'], 'Execute each statement: x becomes 7, y becomes 14, then x becomes 9.'],
  ],
};

function cloneAndShuffle(content: Content[], arenas: Arena[], random: () => number): Challenge[] {
  const rounds = content.map(([id, category, code, outputs, choices, lesson], index) => ({
    id, category, code: [...code], outputs: [...outputs], choices: [...choices], lesson,
    ...arenas[index], obstacles: [...arenas[index].obstacles],
  }));
  for (const round of rounds.slice(1)) {
    for (let i = round.choices.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [round.choices[i], round.choices[j]] = [round.choices[j], round.choices[i]];
    }
  }
  return rounds;
}

export function makeLanguageRounds(language: Exclude<Language, 'python'>, levelId: number, random = Math.random): Challenge[] {
  const content = (language === 'csharp' ? csharp : swift)[levelId];
  if (!content || !arenaByLevel[levelId]) throw new Error(`No ${language} content for Level ${levelId}`);
  return cloneAndShuffle(content, arenaByLevel[levelId], random);
}
