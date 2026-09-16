import { describe, expect, it } from 'vitest';
import { languageForGrade, normalizeUsername } from '../src/data/supabase';

describe('student login helpers', () => {
  it('normalizes the first-and-last-name login format', () => {
    expect(normalizeUsername('  João Marinho ')).toBe('joaomarinho');
    expect(normalizeUsername('Bruno-Soares')).toBe('brunosoares');
  });

  it('maps each grade to its assigned coding journey', () => {
    expect(languageForGrade(7)).toBe('python');
    expect(languageForGrade(8)).toBe('swift');
    expect(languageForGrade(9)).toBe('csharp');
  });
});
