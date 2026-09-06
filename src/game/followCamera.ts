export interface Point { x: number; y: number }
export interface FollowState extends Point { zoom: number }
export function followTarget(player: Point & { vx: number; vy: number }, ball: Point, facing = Math.atan2(player.vy, player.vx)): Point {
  const dx = ball.x - player.x, dy = ball.y - player.y;
  const distance = Math.hypot(dx, dy);
  const ballWeight = Math.min(.20, 90 / Math.max(1, distance));
  // Look down the hood even while lining up a stationary shot. Keep the car
  // inside the unobstructed area above the touch controls and radar.
  const offsetX = player.vx * .10 + Math.cos(facing) * 60 + dx * ballWeight;
  const offsetY = player.vy * .10 + Math.sin(facing) * 60 + dy * ballWeight - 10;
  return { x: player.x + Math.max(-130, Math.min(130, offsetX)), y: player.y + Math.max(-105, Math.min(105, offsetY)) };
}
export function advanceCamera(state: FollowState, target: Point, speed: number, dt: number, reducedMotion: boolean): FollowState {
  const blend = 1 - Math.exp(-dt * (reducedMotion ? 16 : 7));
  const zoom = reducedMotion ? 1.08 : 1.10 - Math.min(1, speed / 590) * .075;
  return { x: state.x + (target.x - state.x) * blend, y: state.y + (target.y - state.y) * blend, zoom: state.zoom + (zoom - state.zoom) * (1 - Math.exp(-dt * 3)) };
}
