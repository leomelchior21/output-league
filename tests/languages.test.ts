import { describe, expect, it } from 'vitest';
import { makeLevelRounds } from '../src/data/challenges';
import type { Language } from '../src/data/levels';

describe('multi-language challenge packs', () => {
  for (const language of ['csharp', 'swift'] as Language[]) {
    for (const levelId of [1, 2, 3, 4]) {
      it(`${language} Level ${levelId} has ten valid playable rounds`, () => {
        const rounds = makeLevelRounds(levelId, () => 0.25, language);
        expect(rounds).toHaveLength(10);
        for (const round of rounds) {
          expect(round.choices).toHaveLength(round.goals);
          for (const output of round.outputs) expect(round.choices).toContain(output);
        }
        expect(rounds[7].orbit).toBe(true);
      });
    }
  }

  it('preserves each language division behavior', () => {
    expect(makeLevelRounds(4, () => 0, 'python')[3].outputs).toEqual(['5.0']);
    expect(makeLevelRounds(4, () => 0, 'csharp')[3]).toMatchObject({ outputs: ['2'] });
    expect(makeLevelRounds(4, () => 0, 'swift')[3]).toMatchObject({ outputs: ['2'] });
    expect(makeLevelRounds(4, () => 0, 'csharp')[3].choices).toContain('2.5');
    expect(makeLevelRounds(4, () => 0, 'swift')[3].choices).toContain('2.5');
  });

  it('uses typed C# variables and inferred mutable Swift variables', () => {
    expect(makeLevelRounds(2, () => 0, 'csharp')[0].code).toEqual(['int x = 6;', 'Console.WriteLine(x);']);
    expect(makeLevelRounds(2, () => 0, 'swift')[0].code).toEqual(['var x = 6', 'print(x)']);
  });

  it('keeps mastery outputs sequential in all languages', () => {
    expect(makeLevelRounds(1, () => 0, 'python')[9].outputs).toHaveLength(2);
    expect(makeLevelRounds(1, () => 0, 'csharp')[9].outputs).toEqual(['GO', '7']);
    expect(makeLevelRounds(1, () => 0, 'swift')[9].outputs).toEqual(['GO', '7']);
    expect(makeLevelRounds(3, () => 0, 'csharp')[9].outputs).toEqual(['9', '3']);
    expect(makeLevelRounds(3, () => 0, 'swift')[9].outputs).toEqual(['9', '3']);
  });
});
