import Phaser from 'phaser';
import { APOTHEM, RADIUS, SIDES, GOAL_HALF_WIDTH, GOAL_DEPTH, GOAL_SIDES, SIDE_COUNT, VERTEX_OFFSET } from './physics';
import type { PitchStyle } from '../data/garage';

export const GOAL_COLORS = [0xffbe53, 0x39bfff, 0xba83ff, 0x46e0d1, 0x7de5a5, 0xff8c72];
export const cssColor = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

/** Bake the detailed terrain once. Only the visible section is painted each frame. */
export function makePitch(scene: Phaser.Scene, style: PitchStyle = 'alpine') {
  const size = 2304;
  const key = `top-down-pitch-${style}`;
  if (scene.textures.exists(key)) return scene.add.image(0, 0, key).setDepth(-10);
  const texture = scene.textures.createCanvas(key, size, size)!;
  const ctx = texture.context;
  const rand = new Phaser.Math.RandomDataGenerator(['output-league-top-down']);
  ctx.translate(size / 2, size / 2);
  const outline = (r: number) => {
    ctx.beginPath();
    for (let i = 0; i < SIDE_COUNT; i++) { const a = VERTEX_OFFSET + i * Math.PI / 4; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.closePath();
  };
  const line = (x1: number, y1: number, x2: number, y2: number) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
  // Water and broken stone apron around the arena.
  ctx.fillStyle = '#081f2c'; ctx.fillRect(-size / 2, -size / 2, size, size);
  for (let i = 0; i < 650; i++) {
    const x = rand.between(-1150, 1150), y = rand.between(-1150, 1150);
    ctx.strokeStyle = 'rgba(62,125,151,.10)'; ctx.lineWidth = 1; line(x, y, x + rand.between(7, 35), y);
  }
  ctx.shadowColor = '#000b'; ctx.shadowBlur = 35; ctx.shadowOffsetY = 14;
  outline(RADIUS + 57); ctx.fillStyle = '#162a35'; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  outline(RADIUS + 47); ctx.lineWidth = 3; ctx.strokeStyle = '#3d5861'; ctx.stroke();
  // Moss and top-down conifers: detail belongs beyond the driving surface.
  for (let i = 0; i < 74; i++) {
    const angle = rand.frac() * Math.PI * 2;
    const radialLimit = APOTHEM / Math.max(...SIDES.map(s => Math.cos(angle) * s.nx + Math.sin(angle) * s.ny));
    const r = radialLimit + 60 + rand.frac() * 130;
    const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
    const tree = rand.frac() > .32, radius = tree ? rand.between(13, 28) : rand.between(8, 18);
    ctx.fillStyle = '#0004'; ctx.beginPath(); ctx.ellipse(x + 9, y + 13, radius * 1.2, radius, 0, 0, Math.PI * 2); ctx.fill();
    for (let layer = 0; layer < (tree ? 3 : 1); layer++) {
      ctx.beginPath();
      for (let j = 0; j < 12; j++) { const a = j * Math.PI / 6, rr = radius * (1 - layer * .25) * (j % 2 ? .66 : 1); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; if (!j) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
      ctx.closePath(); ctx.fillStyle = tree ? ['#163e38', '#245347', '#36725a'][layer] : '#35454b'; ctx.fill();
    }
    ctx.fillStyle = tree ? '#608475' : '#66777b'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.save(); outline(RADIUS - 5); ctx.clip();
  const turf = ctx.createLinearGradient(-700, -800, 650, 800);
  const palette = style === 'ice' ? ['#6595a6', '#497c94', '#315d79'] : style === 'rain' ? ['#184454', '#153b46', '#102e3c'] : style === 'worn' ? ['#727544', '#576440', '#43563a'] : ['#205b4c', '#194c40', '#123e39'];
  turf.addColorStop(0, palette[0]); turf.addColorStop(.5, palette[1]); turf.addColorStop(1, palette[2]);
  ctx.fillStyle = turf; ctx.fillRect(-RADIUS, -RADIUS, RADIUS * 2, RADIUS * 2);
  // Mowing bands and fine, deterministic grass give the camera a sense of speed.
  for (let y = -900; y < 900; y += 160) { ctx.fillStyle = '#83b76c09'; ctx.fillRect(-900, y, 1800, 80); ctx.fillStyle = '#031b1a13'; ctx.fillRect(-900, y + 80, 1800, 80); }
  for (let i = 0; i < 31000; i++) {
    const x = rand.between(-875, 875), y = rand.between(-770, 770);
    ctx.fillStyle = i % 3 ? 'rgba(169,206,123,.055)' : 'rgba(0,24,22,.14)';
    ctx.fillRect(x, y, rand.between(1, 3), rand.between(1, 4));
  }
  ctx.strokeStyle = 'rgba(167,214,160,.055)'; ctx.lineWidth = 1;
  for (let row = -9; row <= 9; row++) for (let col = -11; col <= 11; col++) {
    const x = col * 78, y = row * 90 + (col % 2) * 45;
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const px = x + Math.cos(a) * 52, py = y + Math.sin(a) * 52; if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.stroke();
  }
  if (style !== 'alpine') for (let i = 0; i < 75; i++) {
    const x = rand.between(-850, 850), y = rand.between(-800, 800);
    ctx.beginPath(); ctx.ellipse(x, y, rand.between(12, 80), rand.between(6, 30), rand.frac() * 3, 0, Math.PI * 2);
    ctx.fillStyle = style === 'rain' ? '#92d9ef0c' : style === 'ice' ? '#d7faff12' : '#d4b4781c'; ctx.fill();
    if (style === 'ice') { ctx.strokeStyle = '#d6fbff26'; ctx.lineWidth = 1; line(x, y, x + 55, y + 14); line(x + 55, y + 14, x + 77, y - 5); line(x + 55, y + 14, x + 59, y + 40); }
    if (style === 'rain') { ctx.strokeStyle = '#90d9ef18'; ctx.lineWidth = 1; line(x - 16, y, x + 21, y); }
  }
  // Restrained regulation-style field markings.
  outline(RADIUS - 38); ctx.strokeStyle = '#bdddc34d'; ctx.lineWidth = 3; ctx.stroke();
  outline(RADIUS - 48); ctx.strokeStyle = '#bdddc311'; ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = '#d3e6ca44'; ctx.lineWidth = 3;
  line(-RADIUS, 0, RADIUS, 0);
  const centerOctagon = (r: number) => {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = -Math.PI / 8 + i * Math.PI / 4; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.closePath();
  };
  centerOctagon(143); ctx.stroke();
  ctx.strokeStyle = '#9ce0d827'; ctx.lineWidth = 1; centerOctagon(157); ctx.stroke();
  ctx.fillStyle = '#d3e6ca66'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
  // Crown in the center circle, like paint worn into the turf.
  ctx.fillStyle = '#b6dcc42b'; ctx.beginPath(); ctx.moveTo(-49, -31); ctx.lineTo(-23, -5); ctx.lineTo(0, -42); ctx.lineTo(23, -5); ctx.lineTo(49, -31); ctx.lineTo(36, 28); ctx.lineTo(-36, 28); ctx.closePath(); ctx.fill();
  ctx.fillRect(-36, 37, 72, 5);
  ctx.fillStyle = '#b6dcc426'; ctx.font = '600 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('O U T P U T   L E A G U E', 0, 84);
  GOAL_SIDES.forEach(index => {
    const s = SIDES[index];
    ctx.save(); ctx.translate(s.nx * APOTHEM, s.ny * APOTHEM); ctx.rotate(Math.atan2(s.ny, s.nx) - Math.PI / 2);
    ctx.strokeStyle = '#d8e8ce44'; ctx.lineWidth = 3;
    ctx.strokeRect(-188, -164, 376, 150); ctx.strokeRect(-133, -72, 266, 62);
    ctx.setLineDash([4, 8]); ctx.strokeStyle = '#d8e8ce24'; ctx.beginPath(); ctx.arc(0, -164, 98, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#d6e5c950'; ctx.beginPath(); ctx.arc(0, -218, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
  ctx.restore();
  // Segmented rails, light strips, bolts, and service grilles follow the real edges.
  SIDES.forEach((s, index) => {
    ctx.save(); ctx.translate(s.nx * APOTHEM, s.ny * APOTHEM); ctx.rotate(Math.atan2(s.ny, s.nx) - Math.PI / 2);
    const half = RADIUS * Math.sin(Math.PI / 8);
    const goalSlot = GOAL_SIDES.findIndex(side => side === index);
    for (const [from, to] of goalSlot >= 0 ? [[-half, -GOAL_HALF_WIDTH], [GOAL_HALF_WIDTH, half]] : [[-half, half]]) {
      ctx.fillStyle = '#091820'; ctx.fillRect(from, -9, to - from, 33);
      ctx.fillStyle = '#2b4651'; ctx.fillRect(from, -9, to - from, 17);
      ctx.fillStyle = '#6a8990'; ctx.fillRect(from, -9, to - from, 2);
      ctx.fillStyle = goalSlot >= 0 ? cssColor(GOAL_COLORS[goalSlot]) : '#66a5ae'; ctx.globalAlpha = .7; ctx.fillRect(from + 5, -3, to - from - 10, 3); ctx.globalAlpha = 1;
      for (let x = from + 24; x < to - 12; x += 42) {
        ctx.fillStyle = '#07151b'; ctx.fillRect(x, -6, 3, 20);
        ctx.fillStyle = '#b3c6c8'; ctx.beginPath(); ctx.arc(x + 11, 3, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d7dcbb'; ctx.fillRect(x + 12, 16, 12, 3);
      }
    }
    if (goalSlot >= 0) { ctx.fillStyle = '#091820'; ctx.fillRect(-GOAL_HALF_WIDTH - 13, 0, GOAL_HALF_WIDTH * 2 + 26, GOAL_DEPTH + 15); }
    ctx.restore();
  });
  // Compact grandstands on all eight edges. Fans are baked; only a small waving
  // layer animates, keeping a full stadium inexpensive to draw.
  SIDES.forEach((s, index) => {
    ctx.save(); ctx.translate(s.nx * APOTHEM, s.ny * APOTHEM); ctx.rotate(Math.atan2(s.ny, s.nx) - Math.PI / 2);
    ctx.fillStyle = '#081721'; ctx.beginPath(); ctx.roundRect(-235, 123, 470, 92, 9); ctx.fill();
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = row % 2 ? '#253f50' : '#1b3042'; ctx.fillRect(-228, 131 + row * 19, 456, 17);
      for (let col = 0; col < 42; col++) {
        const x = -220 + col * 10.7, y = 138 + row * 19;
        ctx.fillStyle = ['#81c7d6', '#cfb983', '#bd8bbd', '#6597b7', '#619e86'][rand.between(0, 4)];
        ctx.globalAlpha = .7; ctx.fillRect(x - 2.5, y - 1, 5, 7); ctx.globalAlpha = 1;
        ctx.fillStyle = ['#aeb8aa', '#be9b7f', '#826d5f'][rand.between(0, 2)]; ctx.beginPath(); ctx.arc(x, y - 3, 2.4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.fillStyle = cssColor(GOAL_COLORS[index % 6]); ctx.globalAlpha = .6; ctx.fillRect(-235, 122, 470, 3); ctx.globalAlpha = 1;
    ctx.fillStyle = '#091b2b'; ctx.fillRect(-112, 201, 224, 19); ctx.fillStyle = '#81adbe'; ctx.font = 'bold 10px Arial'; ctx.fillText(index % 2 ? 'CODE. THINK. SCORE.' : 'OUTPUT LEAGUE', 0, 214);
    ctx.restore();
  });
  texture.refresh();
  return scene.add.image(0, 0, texture.key).setDepth(-10);
}

export interface GoalArt { frame: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text }
export function makeGoalArt(scene: Phaser.Scene, color: number, output: string, active: boolean): GoalArt {
  const g = scene.add.graphics(); const w = GOAL_HALF_WIDTH, d = GOAL_DEPTH;
  g.fillStyle(0x03151c, .95).fillRoundedRect(-w, 0, w * 2, d, 5);
  if (active) {
    g.fillStyle(color, .075).fillRect(-w, -55, w * 2, 145);
    g.lineStyle(1, color, .20);
    for (let x = -w + 12; x < w; x += 14) g.lineBetween(x, 5, x * .94, d - 5);
    for (let y = 12; y < d; y += 13) g.lineBetween(-w + 5, y, w - 5, y);
    // Three sides of the net, and an OPEN mouth at y=0.
    const net = [{ x: -w, y: 0 }, { x: -w, y: d - 13 }, { x: -w + 13, y: d }, { x: w - 13, y: d }, { x: w, y: d - 13 }, { x: w, y: 0 }];
    g.lineStyle(25, color, .06).strokePoints(net, false);
    g.lineStyle(17, color, .14).strokePoints(net, false);
    g.lineStyle(9, 0x172f3b).strokePoints(net, false);
    g.lineStyle(4, color, .95).strokePoints(net, false);
    g.lineStyle(1, 0xf1ffff, .85).strokePoints(net, false);
    // Backboard echoes the illuminated terminals in the launcher illustration.
    g.fillStyle(0x051825, .92).fillRoundedRect(-88, 29, 176, 40, 6);
    g.lineStyle(5, color, .12).strokeRoundedRect(-90, 27, 180, 44, 7);
    g.lineStyle(1.5, color, .95).strokeRoundedRect(-88, 29, 176, 40, 6);
    for (const x of [-w + 7, w - 7]) g.lineStyle(2, color, .5).lineBetween(x, 12, x, d - 18);
    g.lineStyle(2, 0xf1ffff, .7).lineBetween(-w, 0, w, 0);
    for (const x of [-w, w]) { g.fillStyle(0x0a202a).fillCircle(x, 0, 13); g.fillStyle(color).fillCircle(x, 0, 9); g.fillStyle(0xf1ffff).fillCircle(x - 2, -2, 4); }
    for (const x of [-78, 0, 78]) { g.lineStyle(2, color, .34).strokePoints([{ x: x - 6, y: -32 }, { x, y: -22 }, { x: x + 6, y: -32 }], false); }
  } else {
    g.fillStyle(0x30434b).fillRect(-w, -9, w * 2, 18);
    g.lineStyle(2, 0x677a80).strokeRect(-w, -9, w * 2, 18);
    for (let x = -w; x < w; x += 20) g.lineStyle(2, 0x12272e).lineBetween(x, -7, x + 12, 7);
    g.lineStyle(3, 0x344e59).strokeRect(-w, 0, w * 2, d);
  }
  const label = scene.add.text(0, 0, active ? output : 'CLOSED', {
    fontFamily: 'Consolas, monospace', fontSize: active ? '29px' : '14px', fontStyle: 'bold',
    color: active ? '#f4ffff' : '#91a6af', backgroundColor: active ? '#061b25ed' : '#10232a',
    padding: { x: 11, y: 6 },
  }).setOrigin(.5).setDepth(12);
  return { frame: scene.add.container(0, 0, [g]).setDepth(2), label };
}
