import Phaser from 'phaser';
import { APOTHEM, SIDES } from './physics';
import type { PitchStyle } from '../data/garage';
import type { FollowState } from './followCamera';
export class StadiumAtmosphere {
  readonly view: Phaser.GameObjects.Graphics;
  cheer = 0;
  constructor(scene: Phaser.Scene, readonly style: PitchStyle) { this.view = scene.add.graphics().setDepth(14); }
  update(dt: number, time: number, camera: FollowState, reduced: boolean) {
    const g = this.view; g.clear(); this.cheer = Math.max(0, this.cheer - dt);
    for (let side = 0; side < 8; side++) {
      const s = SIDES[side];
      for (let i = 0; i < 23; i++) {
        const across = -212 + i * 19, deep = APOTHEM + 138 + (i % 4) * 19;
        const x = s.nx * deep - s.ny * across, y = s.ny * deep + s.nx * across;
        if (Math.abs(x - camera.x) > 660 / camera.zoom || Math.abs(y - camera.y) > 450 / camera.zoom) continue;
        const wave = reduced ? 0 : Math.sin(time * (this.cheer > 0 ? 12 : 3) + i + side) * (this.cheer > 0 ? 5 : 2);
        g.lineStyle(2, i % 2 ? 0xffda8a : 0x81e1f2, .8).lineBetween(x - 4, y - 1, x - 5, y - 5 - wave).lineBetween(x + 4, y - 1, x + 5, y - 5 + wave);
      }
    }
    if (reduced) return;
    if (this.style === 'rain') {
      for (let i = 0; i < 100; i++) {
        const sx = ((i * 137.3 + time * 80) % 1340) - 670, sy = ((i * 79.9 + time * 560) % 960) - 480;
        const x = camera.x + sx / camera.zoom, y = camera.y + sy / camera.zoom;
        g.lineStyle(1, 0xb8e2f2, .12 + i % 3 * .025).lineBetween(x, y, x - 6, y + 20);
      }
      for (let i = 0; i < 15; i++) {
        const age = (time + i * .27) % 1.4;
        const x = Math.sin(i * 55) * 740, y = Math.cos(i * 29) * 650;
        g.lineStyle(1, 0xb3e2f4, (1 - age / 1.4) * .14).strokeEllipse(x, y, 6 + age * 24, 3 + age * 10);
      }
    }
    if (this.style === 'ice') for (let i = 0; i < 36; i++) {
      const x = camera.x + ((i * 173 + time * 13) % 1300 - 650) / camera.zoom;
      const y = camera.y + ((i * 97 + time * 21) % 900 - 450) / camera.zoom;
      g.fillStyle(0xe2faff, .28).fillCircle(x, y, i % 3 === 0 ? 2 : 1);
    }
  }
}
