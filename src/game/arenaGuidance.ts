import Phaser from 'phaser';
import { RADIUS, SIDE_COUNT, VERTEX_OFFSET } from './physics';
import { cssColor } from './pitchArt';

export interface GuidePoint { x: number; y: number; nx?: number; ny?: number; output: string; color: number; active: boolean }
export interface CameraView { x: number; y: number; zoom: number }
export class ArenaGuidance {
  readonly root: Phaser.GameObjects.Container;
  private lines: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[];
  private radarLabels: Phaser.GameObjects.Text[];
  private ballLabel: Phaser.GameObjects.Text;
  private radarTitle: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene) {
    this.lines = scene.add.graphics();
    const text = (size: number) => scene.add.text(0, 0, '', { fontFamily: 'Consolas, monospace', fontSize: `${size}px`, fontStyle: 'bold', color: '#e7faff', backgroundColor: '#081e2cf0', padding: { x: 10, y: 7 } }).setOrigin(.5);
    this.labels = Array.from({ length: 6 }, () => text(19));
    this.radarLabels = Array.from({ length: 6 }, () => scene.add.text(0, 0, '', { fontFamily: 'Consolas, monospace', fontSize: '10px', fontStyle: 'bold' }).setOrigin(.5));
    this.ballLabel = text(14);
    this.radarTitle = scene.add.text(357, 657, 'ARENA RADAR', { fontFamily: 'Arial, sans-serif', fontSize: '9px', color: '#80a9bb', letterSpacing: 2 }).setOrigin(.5);
    this.root = scene.add.container(0, 0, [this.lines, ...this.labels, ...this.radarLabels, this.ballLabel, this.radarTitle]);
  }
  update(camera: CameraView, player: { x: number; y: number }, ball: { x: number; y: number }, goals: GuidePoint[], facing: number, energy: number) {
    const g = this.lines; g.clear();
    // The compass leaves clear space for the code, controls, and radar.
    const screen = (p: { x: number; y: number }) => ({ x: 600 + (p.x - camera.x) * camera.zoom, y: 400 + (p.y - camera.y) * camera.zoom });
    const used: { x: number; y: number }[] = [];
    const indicator = (point: { x: number; y: number }, label: Phaser.GameObjects.Text, color: number, value: string, isBall = false) => {
      const p = screen(point);
      const visible = p.x > 105 && p.x < 1095 && p.y > 165 && p.y < 596;
      label.setVisible(!visible); if (visible) return;
      const dx = p.x - 600, dy = p.y - 410;
      const factor = Math.min(1, 480 / (Math.abs(dx) || 1), (dy < 0 ? 242 : 184) / (Math.abs(dy) || 1));
      let x = 600 + dx * factor, y = 410 + dy * factor;
      // Compactly separate indicators that share an edge when the car is far away.
      for (const other of used) if (Math.abs(other.x - x) < 105 && Math.abs(other.y - y) < 38) { y += 42; if (y > 603) { y = 565; x += x < 600 ? 110 : -110; } }
      used.push({ x, y });
      const angle = Math.atan2(dy, dx), width = Math.max(isBall ? 100 : 70, value.length * 12 + 28);
      g.fillStyle(color, .08).fillRoundedRect(x - width / 2 - 3, y - 21, width + 6, 42, 8);
      g.lineStyle(1, color, .7).strokeRoundedRect(x - width / 2 - 2, y - 20, width + 4, 40, 7);
      const hex = cssColor(color);
      if (label.style.color !== hex) label.setColor(hex);
      label.setText(value).setPosition(x, y);
      const ax = x + Math.cos(angle) * (Math.abs(Math.cos(angle)) * width / 2 + 22), ay = y + Math.sin(angle) * 29;
      g.fillStyle(color, .9).fillTriangle(ax + Math.cos(angle) * 6, ay + Math.sin(angle) * 6, ax + Math.cos(angle + 2.4) * 6, ay + Math.sin(angle + 2.4) * 6, ax + Math.cos(angle - 2.4) * 6, ay + Math.sin(angle - 2.4) * 6);
    };
    const active = goals.filter(goal => goal.active);
    this.labels.forEach((label, i) => { const goal = active[i]; if (!goal) label.setVisible(false); else indicator({ x: goal.x + (goal.nx ?? 0) * 49, y: goal.y + (goal.ny ?? 0) * 49 }, label, goal.color, goal.output); });
    indicator(ball, this.ballLabel, 0xe2f8ff, `BALL · ${Math.max(1, Math.round(Math.hypot(ball.x - player.x, ball.y - player.y) / 40))}m`, true);

    const map = { x: 357, y: 719, scale: 51 / RADIUS };
    g.fillStyle(0x061927, .84).fillRoundedRect(250, 644, 214, 139, 11);
    g.lineStyle(1, 0x527d95, .42).strokeRoundedRect(250, 644, 214, 139, 11);
    const corners = Array.from({ length: SIDE_COUNT }, (_, i) => ({ x: map.x + Math.cos(VERTEX_OFFSET + i * Math.PI / 4) * 51, y: map.y + Math.sin(VERTEX_OFFSET + i * Math.PI / 4) * 51 }));
    g.fillStyle(0x23483f, .6).fillPoints(corners, true); g.lineStyle(1, 0x779f9d, .65).strokePoints(corners, true);
    const rx = (x: number) => map.x + x * map.scale, ry = (y: number) => map.y + y * map.scale;
    const vw = 1200 / camera.zoom * map.scale, vh = 800 / camera.zoom * map.scale;
    g.fillStyle(0x6bddff, .045).fillRect(rx(camera.x) - vw / 2, ry(camera.y) - vh / 2, vw, vh);
    g.lineStyle(1, 0x62caed, .33).strokeRect(rx(camera.x) - vw / 2, ry(camera.y) - vh / 2, vw, vh);
    this.radarLabels.forEach((label, i) => {
      const goal = active[i]; if (!goal) { label.setVisible(false); return; }
      const x = rx(goal.x), y = ry(goal.y), norm = Math.hypot(goal.x, goal.y) || 1;
      g.fillStyle(goal.color).fillCircle(x, y, 3);
      const hex = cssColor(goal.color);
      if (label.style.color !== hex) label.setColor(hex);
      label.setVisible(true).setText(goal.output).setPosition(x + goal.x / norm * 26, y + goal.y / norm * 13);
    });
    g.fillStyle(0xffffff).fillCircle(rx(ball.x), ry(ball.y), 3);
    const px = rx(player.x), py = ry(player.y);
    g.fillStyle(0x58d3ff).fillCircle(px, py, 3.5);
    g.lineStyle(2, 0xa0eaff).lineBetween(px, py, px + Math.cos(facing) * 8, py + Math.sin(facing) * 8);
    // Small fuel strip, separated from the score HUD.
    g.fillStyle(0x315265).fillRoundedRect(258, 776, 198, 3, 2);
    g.fillStyle(energy < .3 ? 0xffbf66 : 0x52cde8).fillRoundedRect(258, 776, Math.max(1, 198 * energy), 3, 2);
  }
}
