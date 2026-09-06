import type { ObstacleKind } from '../data/challenges';
export interface Obstacle { kind: ObstacleKind; x: number; y: number; homeX: number; homeY: number; angle: number; width: number; height: number; radius: number; active: boolean; warning: boolean; vx: number; vy: number }
export function createObstacles(kinds: ObstacleKind[], random = Math.random): Obstacle[] {
  return kinds.map((kind, i) => {
    const x = (i % 2 === 0 ? -1 : 1) * (220 + random() * 100), y = -170 + random() * 290;
    return { kind, x, y, homeX: x, homeY: y, angle: -.45, width: kind === 'rotating-arm' ? 210 : 175, height: 30, radius: kind === 'slow-zone' ? 95 : 34, active: true, warning: false, vx: 0, vy: 0 };
  });
}
export function updateObstacle(o: Obstacle, time: number, dt: number) {
  const oldX = o.x, oldY = o.y;
  o.warning = false; o.active = true;
  if (o.kind === 'moving-wall') o.y = o.homeY + Math.sin(time * .65) * 115;
  if (o.kind === 'disappearing-wall') { const phase = time % 7; o.active = phase >= 3; o.warning = phase >= 1.7 && phase < 3; }
  if (o.kind === 'rotating-arm') o.angle = time * .45;
  if (o.kind === 'orbiting-bumper') { o.x = o.homeX + Math.cos(time * .5) * 70; o.y = o.homeY + Math.sin(time * .5) * 70; }
  o.vx = (o.x - oldX) / dt; o.vy = (o.y - oldY) / dt;
}
