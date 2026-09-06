import { describe, expect, it } from 'vitest';
import { Match, potentialXP } from '../src/game/match';
import { makeRounds, challengeBank } from '../src/data/challenges';
import { pythonLevels } from '../src/data/levels';
import { contain, collideCircles, collideWall, collidePost, crossedGoal, APOTHEM, SIDES, RADIUS, GOAL_SIDES, GOAL_HALF_WIDTH } from '../src/game/physics';
import { advanceCamera, followTarget } from '../src/game/followCamera';
import { createObstacles, updateObstacle } from '../src/game/obstacles';
import { tricksterPhase } from '../src/game/distractions';
import { surfaces, selectPitch } from '../src/data/garage';

describe('the PRINT learning loop', () => {
  it('has a grace period and an XP floor, never a timeout', () => {
    expect(potentialXP(3)).toBe(300); expect(potentialXP(15)).toBe(216); expect(potentialXP(100000)).toBe(60);
    expect(potentialXP(8, true)).toBe(300);
    const match = new Match(); match.tick(99999); expect(match.levelComplete).toBe(false); expect(match.goal(match.targetOutput, false).kind).toBe('correct');
  });
  it('keeps challenge, phase, goal positions and round on a wrong goal', () => {
    const match = new Match(); match.goal(match.targetOutput, true); match.nextRound();
    const before = match.snapshot(); const outcome = match.goal('"HELLO"', false); const after = match.snapshot();
    expect(outcome.kind).toBe('wrong'); expect(after.challenge).toEqual(before.challenge); expect(after.round).toBe(before.round);
    expect(after.score).toBe(before.score - 20); expect(after.streak).toBe(0); expect(after.phase).toBe(0);
    match.goal(match.targetOutput, true); expect(match.breakdown.accuracy).toBe(40); expect(match.streak).toBe(0);
  });
  it('requires mastery outputs in order and awards mastery once', () => {
    const match = new Match(makeRounds(() => .1));
    for (let round = 0; round < 9; round++) { match.goal(match.targetOutput, true); match.nextRound(); }
    const [first, second] = match.challenge.outputs;
    const before = match.score; expect(match.goal(second, true).kind).toBe('wrong');
    expect(match.goal(first, true).kind).toBe('phase'); expect(match.score).toBe(before - 20); expect(match.phase).toBe(1);
    expect(match.goal(second, true).kind).toBe('complete'); expect(match.breakdown.mastery).toBe(100);
    const completedScore = match.score; match.goal(second, true); expect(match.score).toBe(completedScore);
  });
  it('produces three stars for accurate clean play, and blocks random guessing', () => {
    const perfect = new Match(makeRounds(() => .1)); const guessing = new Match(makeRounds(() => .1));
    for (let i = 0; i < 10; i++) {
      guessing.goal('not an output', false); guessing.goal('not an output', false);
      if (i === 9) { perfect.goal(perfect.targetOutput, true); guessing.goal(guessing.targetOutput, true); }
      perfect.goal(perfect.targetOutput, true); guessing.goal(guessing.targetOutput, true);
      if (i < 9) { perfect.nextRound(); guessing.nextRound(); }
    }
    expect(perfect.stars).toBe(3); expect(guessing.stars).toBe(1);
    expect(perfect.breakdown.special).toBe(40); expect(pythonLevels.slice(1).every(l => l.locked)).toBe(true);
    const b = perfect.breakdown; expect(perfect.score).toBe(b.roundXP + b.accuracy + b.cleanShot + b.streak + b.special + b.mastery - b.penalties);
  });
  it('retains valid, unique misconception-based choices through randomization', () => {
    for (let i = 0; i < 20; i++) for (const round of makeRounds()) { expect(round.choices).toHaveLength(round.goals); expect(new Set(round.choices).size).toBe(round.goals); round.outputs.forEach(output => expect(round.choices).toContain(output)); }
    expect(challengeBank.some(c => c.category === 'NEGATIVE NUMBER')).toBe(true);
  });
  it('generates fresh code whose literal values exactly match the expected outputs', () => {
    expect(makeRounds(() => .1).map(r => r.code)).not.toEqual(makeRounds(() => .8).map(r => r.code));
    for (let i = 0; i < 60; i++) for (const round of makeRounds()) {
      expect(round.code.map(line => String(JSON.parse(line.slice(6, -1))))).toEqual(round.outputs);
    }
    expect(challengeBank[0].code).toEqual(['print(8)']);
  });
  it('offers gentler surface changes and a bounded, signaled rover cameo', () => {
    expect(selectPitch('ice')).toBe('ice'); expect(selectPitch('shuffle', () => .8)).toBe('worn');
    expect(surfaces.ice.grip).toBeLessThan(surfaces.rain.grip); expect(surfaces.ice.drag).toBeLessThan(surfaces.alpine.drag);
    expect(tricksterPhase(5.9)).toBe('quiet'); expect(tricksterPhase(6.5)).toBe('warning');
    expect(tricksterPhase(7.1)).toBe('active'); expect(tricksterPhase(10)).toBe('quiet'); expect(tricksterPhase(16)).toBe('quiet');
  });
});

describe('arena collision and obstacle rules', () => {
  it('contains and reflects a ball on every octagon side', () => {
    for (const s of SIDES) {
      const ball = { x: s.nx * (APOTHEM + 40), y: s.ny * (APOTHEM + 40), vx: s.nx * 100, vy: s.ny * 100, radius: 15 };
      contain(ball, .76); expect(ball.x * s.nx + ball.y * s.ny + 15).toBeLessThanOrEqual(APOTHEM + .01);
      expect(ball.vx * s.nx + ball.vy * s.ny).toBeLessThan(0);
    }
  });
  it('has eight sides, six goal pockets, and three times the original playable area', () => {
    expect(SIDES).toHaveLength(8); expect(GOAL_SIDES).toHaveLength(6);
    const originalArea = 3 * Math.sqrt(3) / 2 * 505 ** 2;
    expect(2 * Math.sqrt(2) * RADIUS ** 2 / originalArea).toBeCloseTo(3);
  });
  it('allows the ball through an open goal but requires it to cross the scoring line', () => {
    for (const index of GOAL_SIDES) {
      const s = SIDES[index];
      const ball = { x: s.nx * (APOTHEM - 4), y: s.ny * (APOTHEM - 4), vx: s.nx * 500, vy: s.ny * 500, radius: 18 };
      contain(ball, .78, new Set([index])); expect(crossedGoal(ball, index)).toBe(false);
      ball.x += s.nx * 20; ball.y += s.ny * 20;
      expect(crossedGoal(ball, index)).toBe(true);
      ball.x += s.tx * GOAL_HALF_WIDTH; ball.y += s.ty * GOAL_HALF_WIDTH;
      expect(crossedGoal(ball, index)).toBe(false);
    }
  });
  it('deflects a ball striking a goalpost instead of counting a goal', () => {
    const ball = { x: GOAL_HALF_WIDTH - 10, y: -12, vx: 0, vy: 500, radius: 18 };
    expect(collidePost(ball, GOAL_HALF_WIDTH, 0)).toBe(true);
    expect(ball.vx).toBeLessThan(0); expect(ball.vy).toBeLessThan(500);
    expect(Math.hypot(ball.x - GOAL_HALF_WIDTH, ball.y)).toBeCloseTo(28);
  });
  it('transfers car momentum into a ball without leaving overlap', () => {
    const car = { x: 0, y: 0, vx: 220, vy: 0, radius: 22 }; const ball = { x: 30, y: 0, vx: 0, vy: 0, radius: 15 };
    expect(collideCircles(car, ball)).toBe(true); expect(ball.vx).toBeGreaterThan(200); expect(ball.x - car.x).toBeCloseTo(37);
  });
  it('resolves a wall appearing over the ball without trapping it', () => {
    const ball = { x: 0, y: 0, vx: 0, vy: 0, radius: 15 };
    expect(collideWall(ball, 0, 0, 126, 24, 0)).toBe(true); expect(Math.abs(ball.y)).toBeGreaterThanOrEqual(27);
  });
  it('warns before a disappearing wall becomes physical and moves barriers', () => {
    const [wall] = createObstacles(['disappearing-wall']); updateObstacle(wall, 1, .1); expect(wall.active).toBe(false);
    updateObstacle(wall, 2, .1); expect(wall.warning).toBe(true); expect(wall.active).toBe(false);
    updateObstacle(wall, 3.1, .1); expect(wall.active).toBe(true);
    const [moving] = createObstacles(['moving-wall']); const y = moving.y; updateObstacle(moving, 2, .1); expect(moving.y).not.toBe(y);
  });
});

describe('car-following camera', () => {
  it('keeps a distant ball from dragging the camera away from the player', () => {
    const target = followTarget({ x: 100, y: 100, vx: 0, vy: 0 }, { x: 10000, y: 100 });
    expect(target.x - 100).toBeLessThanOrEqual(130); expect(target.y).toBe(90);
  });
  it('smoothly follows movement and keeps reduced-motion zoom stable', () => {
    let camera = { x: 0, y: 0, zoom: 1.08 };
    for (let i = 0; i < 120; i++) camera = advanceCamera(camera, { x: 300, y: -150 }, 590, 1 / 120, true);
    expect(camera.x).toBeCloseTo(300, 1); expect(camera.y).toBeCloseTo(-150, 1); expect(camera.zoom).toBeCloseTo(1.08);
  });
});
