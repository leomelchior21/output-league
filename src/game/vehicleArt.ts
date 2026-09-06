import Phaser from 'phaser';
import { cssColor } from './pitchArt';

export interface CarArt { view: Phaser.GameObjects.Container; frontWheels: Phaser.GameObjects.Container; exhaust: Phaser.GameObjects.Graphics }
export function makeCarArt(scene: Phaser.Scene, color: number, decal: 'crown' | 'stripes' | 'bolt' = 'crown'): CarArt {
  const key = `rover-${color}-${decal}`;
  if (!scene.textures.exists(key)) {
    const texture = scene.textures.createCanvas(key, 100, 84)!; const c = texture.context;
    c.translate(50, 42);
    const rect = (x: number, y: number, w: number, h: number, r: number, fill: string) => { c.fillStyle = fill; c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
    // Front is local +X. Highlight, glass and headlights remain attached to the car.
    rect(-25, -25, 17, 10, 3, '#071018'); rect(-25, 15, 17, 10, 3, '#071018');
    c.fillStyle = '#7a919c'; c.fillRect(-22, -24, 10, 2); c.fillRect(-22, 22, 10, 2);
    rect(-34, -18, 69, 38, 11, '#052943');
    const body = c.createLinearGradient(0, -20, 0, 20); body.addColorStop(0, '#d5faff'); body.addColorStop(.18, cssColor(color)); body.addColorStop(.72, cssColor(color)); body.addColorStop(1, '#183a58');
    c.fillStyle = body; c.beginPath(); c.roundRect(-33, -20, 69, 38, 11); c.fill();
    c.strokeStyle = '#bdefff9c'; c.lineWidth = 1.5; c.stroke();
    rect(-14, -16, 31, 28, 8, '#061c2b');
    const glass = c.createLinearGradient(-5, -14, 14, 10); glass.addColorStop(0, '#153d58'); glass.addColorStop(1, '#7bcee7');
    c.fillStyle = glass; c.beginPath(); c.roundRect(6, -14, 11, 24, 3); c.fill();
    rect(-16, -13, 7, 22, 3, '#3b819e'); rect(-8, -16, 14, 28, 4, cssColor(color));
    c.fillStyle = '#ffd169';
    if (decal === 'crown') { c.beginPath(); c.moveTo(-6, -7); c.lineTo(-2, -3); c.lineTo(1, -8); c.lineTo(4, -3); c.lineTo(7, -7); c.lineTo(5, 2); c.lineTo(-4, 2); c.closePath(); c.fill(); c.fillRect(-4, 4, 9, 1.5); }
    else if (decal === 'stripes') { c.fillStyle = '#fff4d6'; c.fillRect(-7, -9, 13, 3); c.fillRect(-7, 3, 13, 3); c.fillRect(20, -7, 10, 3); c.fillRect(20, 2, 10, 3); }
    else { c.beginPath(); c.moveTo(0, -12); c.lineTo(-7, 1); c.lineTo(-1, 1); c.lineTo(-4, 11); c.lineTo(8, -4); c.lineTo(1, -4); c.closePath(); c.fill(); }
    rect(20, -12, 9, 2, 1, '#d5faff99'); rect(20, 6, 9, 2, 1, '#06375788');
    rect(31, -14, 6, 8, 2, '#dcfcff'); rect(31, 3, 6, 8, 2, '#dcfcff');
    rect(-35, -15, 4, 8, 1, '#ff766e'); rect(-35, 4, 4, 8, 1, '#ff766e');
    rect(-36, -24, 7, 45, 3, '#102936'); rect(-34, -23, 3, 43, 1, '#68bad5');
    rect(-39, -12, 6, 5, 2, '#80e9ff'); rect(-39, 4, 6, 5, 2, '#80e9ff');
    texture.refresh();
  }
  const frontWheels = scene.add.container();
  for (const y of [-20, 20]) {
    const g = scene.add.graphics().setPosition(20, y);
    g.fillStyle(0x070f16).fillRoundedRect(-9, -5, 18, 10, 3);
    g.lineStyle(1.5, 0x899ba6).lineBetween(-6, -3, 6, -3).lineBetween(-6, 3, 6, 3);
    frontWheels.add(g);
  }
  const exhaust = scene.add.graphics();
  return { view: scene.add.container(0, 0, [frontWheels, scene.add.image(0, 0, key), exhaust]).setDepth(10), frontWheels, exhaust };
}

type V3 = { x: number; y: number; z: number };
type Quaternion = V3 & { w: number };
const normalize = (v: V3): V3 => { const d = Math.hypot(v.x, v.y, v.z); return { x: v.x / d, y: v.y / d, z: v.z / d }; };

/** Sphere panels roll around the ground-contact axis, rather than spinning as a flat icon. */
export class RollingBall {
  readonly view: Phaser.GameObjects.Container;
  private seams: Phaser.GameObjects.Graphics;
  private panels: V3[][] = [];
  private rotation: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
  constructor(scene: Phaser.Scene, readonly radius: number) {
    if (!scene.textures.exists('ball-sphere')) {
      const tex = scene.textures.createCanvas('ball-sphere', 64, 64)!; const c = tex.context;
      const fill = c.createRadialGradient(24, 21, 1, 32, 32, radius + 2);
      fill.addColorStop(0, '#ffffff'); fill.addColorStop(.5, '#e2f7fc'); fill.addColorStop(.83, '#91bacc'); fill.addColorStop(1, '#326b86');
      c.fillStyle = fill; c.beginPath(); c.arc(32, 32, radius, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#b8efff'; c.lineWidth = 1; c.stroke(); tex.refresh();
    }
    const golden = (1 + Math.sqrt(5)) / 2;
    const centers: V3[] = [];
    for (const a of [-1, 1]) for (const b of [-golden, golden]) centers.push(normalize({ x: 0, y: a, z: b }), normalize({ x: a, y: b, z: 0 }), normalize({ x: b, y: 0, z: a }));
    for (const center of centers) {
      const tangent = normalize(Math.abs(center.z) < .9 ? { x: -center.y, y: center.x, z: 0 } : { x: center.z, y: 0, z: -center.x });
      const other = { x: center.y * tangent.z - center.z * tangent.y, y: center.z * tangent.x - center.x * tangent.z, z: center.x * tangent.y - center.y * tangent.x };
      this.panels.push(Array.from({ length: 5 }, (_, i) => {
        const angle = i * Math.PI * 2 / 5;
        return normalize({ x: center.x + .27 * (Math.cos(angle) * tangent.x + Math.sin(angle) * other.x), y: center.y + .27 * (Math.cos(angle) * tangent.y + Math.sin(angle) * other.y), z: center.z + .27 * (Math.cos(angle) * tangent.z + Math.sin(angle) * other.z) });
      }));
    }
    this.seams = scene.add.graphics();
    const shine = scene.add.graphics().fillStyle(0xffffff, .37).fillEllipse(-5, -7, 9, 5);
    this.view = scene.add.container(0, 0, [scene.add.image(0, 0, 'ball-sphere'), this.seams, shine]).setDepth(11);
    this.roll(0, 0);
  }
  roll(dx: number, dy: number) {
    const distance = Math.hypot(dx, dy);
    if (distance > 0) {
      const a = distance / this.radius / 2, sin = Math.sin(a);
      const p = { x: -dy / distance * sin, y: dx / distance * sin, z: 0, w: Math.cos(a) }, q = this.rotation;
      const next = { x: p.w * q.x + p.x * q.w + p.y * q.z, y: p.w * q.y - p.x * q.z + p.y * q.w, z: p.w * q.z + p.x * q.y - p.y * q.x, w: p.w * q.w - p.x * q.x - p.y * q.y };
      const d = Math.hypot(next.x, next.y, next.z, next.w);
      this.rotation = { x: next.x / d, y: next.y / d, z: next.z / d, w: next.w / d };
    }
    const q = this.rotation;
    const rotate = (v: V3): V3 => {
      const tx = 2 * (q.y * v.z - q.z * v.y), ty = 2 * (q.z * v.x - q.x * v.z), tz = 2 * (q.x * v.y - q.y * v.x);
      return { x: v.x + q.w * tx + q.y * tz - q.z * ty, y: v.y + q.w * ty + q.z * tx - q.x * tz, z: v.z + q.w * tz + q.x * ty - q.y * tx };
    };
    const g = this.seams; g.clear();
    for (const panel of this.panels) {
      const points = panel.map(rotate), clipped: V3[] = [];
      for (let i = 0; i < points.length; i++) {
        const a = points[i], b = points[(i + 1) % points.length];
        if (a.z >= 0) clipped.push(a);
        if ((a.z >= 0) !== (b.z >= 0)) { const t = a.z / (a.z - b.z); clipped.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: 0 }); }
      }
      if (clipped.length < 3) continue;
      g.fillStyle(0x17455e, .95).fillPoints(clipped.map(v => ({ x: v.x * this.radius, y: v.y * this.radius })), true);
      g.lineStyle(.65, 0x548499, .7).strokePoints(clipped.map(v => ({ x: v.x * this.radius, y: v.y * this.radius })), true);
    }
  }
}
