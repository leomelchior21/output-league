export interface Body { x: number; y: number; vx: number; vy: number; radius: number }
// Three times the original playable area, without making travel three times longer.
export const SIDE_COUNT = 8;
export const VERTEX_OFFSET = Math.PI / 8;
export const RADIUS = 505 * Math.sqrt((3 * (3 * Math.sqrt(3) / 2)) / (2 * Math.sqrt(2)));
export const APOTHEM = RADIUS * Math.cos(Math.PI / 8);
// Six pockets: top, bottom, and the four diagonal sides. East/west stay solid.
export const GOAL_SIDES = [0, 1, 2, 4, 5, 6] as const;
export const GOAL_HALF_WIDTH = 120;
export const GOAL_DEPTH = 92;
export const GOAL_POST_RADIUS = 10;
export const SIDES = Array.from({ length: SIDE_COUNT }, (_, i) => {
  const a = (i + 1) * Math.PI / 4;
  return { nx: Math.cos(a), ny: Math.sin(a), tx: -Math.sin(a), ty: Math.cos(a) };
});
export function contain(body: Body, bounce: number, openSides: ReadonlySet<number> = new Set()) {
  for (const [index, side] of SIDES.entries()) {
    const along = body.x * side.tx + body.y * side.ty;
    if (openSides.has(index) && Math.abs(along) < GOAL_HALF_WIDTH - GOAL_POST_RADIUS) continue;
    const distance = body.x * side.nx + body.y * side.ny;
    const excess = distance + body.radius - APOTHEM;
    if (excess > 0) {
      body.x -= side.nx * excess; body.y -= side.ny * excess;
      const outward = body.vx * side.nx + body.vy * side.ny;
      if (outward > 0) { body.vx -= (1 + bounce) * outward * side.nx; body.vy -= (1 + bounce) * outward * side.ny; }
    }
  }
}
export function crossedGoal(body: Body, index: number) {
  const side = SIDES[index];
  return body.x * side.nx + body.y * side.ny >= APOTHEM + body.radius * .5
    && Math.abs(body.x * side.tx + body.y * side.ty) <= GOAL_HALF_WIDTH - GOAL_POST_RADIUS - body.radius;
}
export function collidePost(body: Body, x: number, y: number, radius = GOAL_POST_RADIUS, bounce = .78) {
  const dx = body.x - x, dy = body.y - y, distance = Math.hypot(dx, dy);
  if (distance >= body.radius + radius) return false;
  const nx = distance > .001 ? dx / distance : 1, ny = distance > .001 ? dy / distance : 0;
  body.x = x + nx * (body.radius + radius); body.y = y + ny * (body.radius + radius);
  const approach = body.vx * nx + body.vy * ny;
  if (approach < 0) { body.vx -= (1 + bounce) * approach * nx; body.vy -= (1 + bounce) * approach * ny; }
  return true;
}
export function collideCircles(a: Body, b: Body, force = 1) {
  const dx = b.x - a.x, dy = b.y - a.y, distance = Math.hypot(dx, dy);
  if (distance >= a.radius + b.radius) return false;
  const nx = distance > .001 ? dx / distance : 1, ny = distance > .001 ? dy / distance : 0;
  const overlap = a.radius + b.radius - distance;
  a.x -= nx * overlap * .25; a.y -= ny * overlap * .25;
  b.x += nx * overlap * .75; b.y += ny * overlap * .75;
  const approach = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
  if (approach > 0) { const impulse = approach * 1.5 * force; b.vx += nx * impulse; b.vy += ny * impulse; a.vx -= nx * approach * .2; a.vy -= ny * approach * .2; }
  return true;
}
export function collideWall(body: Body, x: number, y: number, width: number, height: number, angle: number, vx = 0, vy = 0) {
  const cos = Math.cos(angle), sin = Math.sin(angle), dx = body.x - x, dy = body.y - y;
  const lx = dx * cos + dy * sin, ly = -dx * sin + dy * cos;
  const qx = Math.max(-width / 2, Math.min(width / 2, lx)), qy = Math.max(-height / 2, Math.min(height / 2, ly));
  let nx = lx - qx, ny = ly - qy, distance = Math.hypot(nx, ny);
  if (distance >= body.radius) return false;
  if (distance < .001) {
    const edgeX = width / 2 - Math.abs(lx), edgeY = height / 2 - Math.abs(ly);
    if (edgeX < edgeY) { nx = lx >= 0 ? 1 : -1; ny = 0; distance = -edgeX; }
    else { nx = 0; ny = ly >= 0 ? 1 : -1; distance = -edgeY; }
  } else { nx /= distance; ny /= distance; }
  const wx = nx * cos - ny * sin, wy = nx * sin + ny * cos;
  body.x += wx * (body.radius - distance); body.y += wy * (body.radius - distance);
  const approach = (body.vx - vx) * wx + (body.vy - vy) * wy;
  if (approach < 0) { body.vx -= wx * approach * 1.75; body.vy -= wy * approach * 1.75; }
  return true;
}
