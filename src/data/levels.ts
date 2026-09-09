export type Language = 'python' | 'csharp' | 'swift';
export type LevelIcon = 'terminal' | 'box' | 'database' | 'calculator' | 'keyboard' | 'split' | 'repeat' | 'crown';

export interface Level {
  id: number;
  title: string;
  description: string;
  icon: LevelIcon;
  locked: boolean;
  concept: string;
  language: Language;
}

export interface LanguagePack {
  id: Language;
  displayName: string;
  route: string;
  accent: string;
  journeyTitle: string;
  levels: Level[];
}

const sharedFuture = [
  { id: 5, title: 'USER INPUT', description: 'Receive information from the player.', icon: 'keyboard' as const },
  { id: 6, title: 'CONDITIONS', description: 'Make decisions in code.', icon: 'split' as const },
  { id: 7, title: 'LOOPS', description: 'Repeat actions and automate.', icon: 'repeat' as const },
  { id: 8, title: 'FINAL LEAGUE', description: 'Put everything together.', icon: 'crown' as const },
];

const futureLevels = (language: Language) => sharedFuture.map(level => ({ ...level, language, locked: true, concept: level.id === 5 ? 'INPUT' : level.id === 6 ? 'IF / ELSE' : level.id === 7 ? 'REPEAT' : 'THE FINAL ARENA' }));

export const pythonLevels: Level[] = [
  { id: 1, title: 'PRINT', description: 'Make things appear on screen.', icon: 'terminal', locked: false, concept: 'print("HELLO")', language: 'python' },
  { id: 2, title: 'SIMPLE VARIABLES', description: 'Store values in memory.', icon: 'box', locked: false, concept: 'score = 10', language: 'python' },
  { id: 3, title: 'RETRIEVING DATA', description: 'Read and update stored values.', icon: 'database', locked: false, concept: 'print(score)', language: 'python' },
  { id: 4, title: 'BASIC OPERATIONS', description: 'Work with numbers and values.', icon: 'calculator', locked: false, concept: '+ − × ÷', language: 'python' },
  ...futureLevels('python'),
];

export const csharpLevels: Level[] = [
  { id: 1, title: 'WRITE LINE', description: 'Send a value to the console.', icon: 'terminal', locked: false, concept: 'Console.WriteLine(8);', language: 'csharp' },
  { id: 2, title: 'SIMPLE VARIABLES', description: 'Store typed numbers and text.', icon: 'box', locked: false, concept: 'int score = 10;', language: 'csharp' },
  { id: 3, title: 'RETRIEVING DATA', description: 'Copy and update stored values.', icon: 'database', locked: false, concept: 'Console.WriteLine(x);', language: 'csharp' },
  { id: 4, title: 'BASIC OPERATIONS', description: 'Calculate with integer values.', icon: 'calculator', locked: false, concept: '+ − × ÷', language: 'csharp' },
  ...futureLevels('csharp'),
];

export const swiftLevels: Level[] = [
  { id: 1, title: 'PRINT', description: 'Make the console speak.', icon: 'terminal', locked: false, concept: 'print("HELLO")', language: 'swift' },
  { id: 2, title: 'SIMPLE VARIABLES', description: 'Store values with type inference.', icon: 'box', locked: false, concept: 'var score = 10', language: 'swift' },
  { id: 3, title: 'RETRIEVING DATA', description: 'Move and update stored values.', icon: 'database', locked: false, concept: 'print(score)', language: 'swift' },
  { id: 4, title: 'BASIC OPERATIONS', description: 'Calculate with integer values.', icon: 'calculator', locked: false, concept: '+ − × ÷', language: 'swift' },
  ...futureLevels('swift'),
];

export const languages: Record<Language, LanguagePack> = {
  python: { id: 'python', displayName: 'Python', route: 'python', accent: '#65d8ff', journeyTitle: 'Your Python journey', levels: pythonLevels },
  csharp: { id: 'csharp', displayName: 'C#', route: 'csharp', accent: '#b68cff', journeyTitle: 'Your C# journey', levels: csharpLevels },
  swift: { id: 'swift', displayName: 'Swift', route: 'swift', accent: '#ff8a65', journeyTitle: 'Your Swift journey', levels: swiftLevels },
};

export const isLanguage = (value: string): value is Language => value === 'python' || value === 'csharp' || value === 'swift';
