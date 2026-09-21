import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  session: null as { username: string; grade: number } | null,
  saved: true,
  calls: [] as unknown[][],
}));

vi.mock('../src/data/supabase', () => ({
  getStudentSession: () => state.session,
  saveStudentProgressRemote: async (...args: unknown[]) => { state.calls.push(args); return state.saved; },
  saveStudentSettingsRemote: async () => {},
}));

import { clearStudentStorage, flushPendingProgress, queuePendingProgress, saveProgress } from '../src/data/storage';

class MemoryStorage {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  setItem(key: string, value: string) { this.data.set(key, String(value)); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  get length() { return this.data.size; }
}

const pending = () => JSON.parse(localStorage.getItem('output-league:pending-progress') || 'null');

describe('pending progress queue', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    state.session = { username: 'ana', grade: 7 };
    state.saved = true;
    state.calls = [];
  });

  it('keeps the best score for a level and stays scoped to the signed-in student', () => {
    queuePendingProgress('python', 1, 100, 1);
    queuePendingProgress('python', 1, 300, 2);
    queuePendingProgress('python', 2, 50, 0);
    expect(pending()).toEqual({
      owner: 'ana:7',
      items: [
        { language: 'python', levelId: 1, score: 300, stars: 2 },
        { language: 'python', levelId: 2, score: 50, stars: 0 },
      ],
    });
  });

  it('flushes queued saves and clears them once the server accepts them', async () => {
    queuePendingProgress('python', 1, 100, 1);
    queuePendingProgress('swift', 3, 250, 3);
    await expect(flushPendingProgress()).resolves.toBe(true);
    expect(state.calls).toEqual([
      ['python', 1, 100, 1],
      ['swift', 3, 250, 3],
    ]);
    expect(pending()).toBeNull();
  });

  it('keeps saves that still fail so the next login can retry them', async () => {
    queuePendingProgress('python', 1, 100, 1);
    state.saved = false;
    await expect(flushPendingProgress()).resolves.toBe(false);
    expect(pending().items).toEqual([{ language: 'python', levelId: 1, score: 100, stars: 1 }]);
  });

  it('drops another student’s queue instead of saving it to the wrong account', async () => {
    queuePendingProgress('python', 1, 100, 1);
    state.session = { username: 'bruno', grade: 7 };
    await expect(flushPendingProgress()).resolves.toBe(false);
    expect(state.calls).toEqual([]);
    expect(pending()).toBeNull();
  });

  it('queues a completed level when the remote save fails', async () => {
    state.saved = false;
    saveProgress(120, 2, 3, 'python');
    await vi.waitFor(() => expect(pending()?.items).toEqual([{ language: 'python', levelId: 3, score: 120, stars: 2 }]));
  });

  it('removes queued saves when the student signs out', () => {
    queuePendingProgress('python', 1, 100, 1);
    clearStudentStorage();
    expect(pending()).toBeNull();
  });
});
