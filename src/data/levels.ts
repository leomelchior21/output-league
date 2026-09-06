export type Language = 'python' | 'csharp';
export type LevelIcon = 'terminal' | 'box' | 'database' | 'calculator' | 'keyboard' | 'split' | 'repeat' | 'crown';
export interface Level { id: number; title: string; description: string; icon: LevelIcon; locked: boolean; concept: string }
export const pythonLevels: Level[] = [
  { id: 1, title: 'PRINT', description: 'Make things appear on screen.', icon: 'terminal', locked: false, concept: 'print("HELLO")' },
  { id: 2, title: 'SIMPLE VARIABLES', description: 'Store values in memory.', icon: 'box', locked: true, concept: 'score = 10' },
  { id: 3, title: 'RETRIEVING DATA', description: 'Read and update stored values.', icon: 'database', locked: true, concept: 'print(score)' },
  { id: 4, title: 'BASIC OPERATIONS', description: 'Work with numbers and values.', icon: 'calculator', locked: true, concept: '+ − × ÷' },
  { id: 5, title: 'USER INPUT', description: 'Receive information from the player.', icon: 'keyboard', locked: true, concept: 'input()' },
  { id: 6, title: 'CONDITIONS', description: 'Make decisions in code.', icon: 'split', locked: true, concept: 'if / else' },
  { id: 7, title: 'LOOPS', description: 'Repeat actions and automate.', icon: 'repeat', locked: true, concept: 'for / while' },
  { id: 8, title: 'FINAL LEAGUE', description: 'Put everything together.', icon: 'crown', locked: true, concept: 'THE FINAL ARENA' },
];
