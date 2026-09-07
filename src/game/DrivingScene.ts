import Phaser from 'phaser';
import { Match } from './match';
import { APOTHEM, GOAL_SIDES, GOAL_HALF_WIDTH, GOAL_DEPTH, SIDES, contain, crossedGoal, collideCircles, collideWall, collidePost, type Body } from './physics';
import { createObstacles, updateObstacle, type Obstacle } from './obstacles';
import { makePitch, makeGoalArt, GOAL_COLORS, type GoalArt } from './pitchArt';
import { makeCarArt, RollingBall, type CarArt } from './vehicleArt';
import { ArenaGuidance } from './arenaGuidance';
import { advanceCamera, followTarget, type FollowState } from './followCamera';
import type { ArenaOptions, Controls } from './ArenaScene';
import { paints, trails, selectPitch, surfaces, type PitchStyle } from '../data/garage';
import { StadiumAtmosphere } from './StadiumAtmosphere';
import { tricksterPhase } from './distractions';

interface Goal { index: number; output: string; x: number; y: number; nx: number; ny: number; color: number; active: boolean; art: GoalArt }
interface Spark { x: number; y: number; vx: number; vy: number; life: number; color: number }
interface Trail { x: number; y: number; facing: number; age: number; boost: boolean; skid: number }
interface Ripple { x: number; y: number; age: number; color: number; size: number }
const ORBIT_RADIUS = 475;
const ROUND_ZOOM_TIME = 1.45;
const COUNTDOWN_TIME = 3;

export class ArenaScene extends Phaser.Scene {
  readonly match = new Match();
  readonly controls: Controls;
  readonly options: ArenaOptions;
  readonly player: Body = { x: 0, y: 115, vx: 0, vy: 0, radius: 25 };
  readonly ball: Body = { x: 0, y: 35, vx: 0, vy: 0, radius: 18 };
  bot?: Body;
  goals: Goal[] = [];
  obstacles: Obstacle[] = [];
  facing = -Math.PI / 2;
  boostEnergy = 1;
  cameraState: FollowState = { x: 0, y: 50, zoom: 1.10 };
  readonly pitchStyle: PitchStyle;
  introElapsed = 0;
  introDone = false;
  private atmosphere!: StadiumAtmosphere;
  private carKey = '';
  private trailColor = 0x71e4ff;
  private botPhase = 'quiet';
  private botCarrying = false;
  private botClock = 0;
  private botPortal = { x: 0, y: 0 };
  private botDestination = { x: 0, y: 0 };
  private botCarryElapsed = 0;
  private botBallProtected = false;
  private botPickupBlockedUntil = 0;
  private pitCooldown = 0;
  private world!: Phaser.GameObjects.Container;
  private pitch!: Phaser.GameObjects.Image;
  private car!: CarArt;
  private botView!: CarArt;
  private ballArt!: RollingBall;
  private countdownText!: Phaser.GameObjects.Text;
  private guidance!: ArenaGuidance;
  private groundFx!: Phaser.GameObjects.Graphics;
  private airFx!: Phaser.GameObjects.Graphics;
  private obstacleGraphics!: Phaser.GameObjects.Graphics;
  private keyboard!: Record<string, Phaser.Input.Keyboard.Key>;
  private openGoalSides = new Set<number>();
  private sparks: Spark[] = [];
  private trails: Trail[] = [];
  private ballTrail: { x: number; y: number; age: number }[] = [];
  private ripples: Ripple[] = [];
  private elapsed = 0;
  private accumulator = 0;
  private hudElapsed = 0;
  private trailElapsed = 0;
  private transition = 0;
  private pendingNext = false;
  private roundZoom = 0;
  private countdown = 0;
  private portal = { x: 0, y: 0, age: 2, duration: 1.2 };
  private activePitchStyle: PitchStyle = 'alpine';
  private lastKick = -100;
  private lastAttempt = -100;
  private lastBump = -100;
  private boostHeld = false;
  private boostExhausted = false;
  private goalTouch = false;
  private steering = 0;
  private ballTravel = { x: 0, y: 0 };
  private ballHop = 0;
  private spawnElapsed = 1;
  private spawnAngle = 0;
  private spawnLift = 0;

  constructor(options: ArenaOptions) { super('Arena'); this.options = options; this.controls = options.controls; this.pitchStyle = selectPitch(this.controls.settings?.pitch ?? 'shuffle'); }

  create() {
    this.world = this.add.container(0, 0);
    this.obstacleGraphics = this.add.graphics().setDepth(4);
    this.groundFx = this.add.graphics().setDepth(1);
    this.airFx = this.add.graphics().setDepth(13);
    this.car = makeCarArt(this, 0x1baef4);
    this.botView = makeCarArt(this, 0xb782ed); this.botView.view.setVisible(false);
    this.ballArt = new RollingBall(this, this.ball.radius);
    this.countdownText = this.add.text(0, -36, '', { fontFamily: 'Barlow Condensed, Arial', fontSize: '104px', fontStyle: '900', color: '#fff6c6' }).setOrigin(.5).setDepth(30).setVisible(false);
    this.atmosphere = new StadiumAtmosphere(this, this.pitchStyle);
    this.pitch = makePitch(this, this.activePitchStyle);
    this.world.add([this.pitch, this.groundFx, this.obstacleGraphics, this.car.view, this.botView.view, this.ballArt.view, this.countdownText, this.airFx, this.atmosphere.view]);
    this.applyGarage();
    this.guidance = new ArenaGuidance(this);
    const hudCamera = this.cameras.add(0, 0, 1200, 800, false, 'guidance');
    hudCamera.ignore(this.world); this.cameras.main.ignore(this.guidance.root);
    this.cameras.main.setBackgroundColor('#081f2c');
    this.keyboard = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,SHIFT') as Record<string, Phaser.Input.Keyboard.Key>;
    this.input.keyboard!.on('keydown-SPACE', (event: KeyboardEvent) => { if (!event.repeat && !this.controls.paused) this.controls.kickRequested = true; });
    this.input.keyboard!.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE']);
    this.configureRound();
    this.cameraState = { x: 0, y: 0, zoom: .32 }; this.updateCamera(0); this.guidance.root.setVisible(false);
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('qa')) {
      const debugWindow = window as unknown as { __arena?: ArenaScene };
      debugWindow.__arena = this;
      this.events.once('shutdown', () => { if (debugWindow.__arena === this) delete debugWindow.__arena; });
    }
    this.options.onSnapshot(this.match.snapshot()); this.options.onReady();
  }

  private makeGoal(slot: number, output: string, active: boolean): Goal {
    const color = GOAL_COLORS[slot], index = GOAL_SIDES[slot];
    const art = makeGoalArt(this, color, output, active);
    this.world.add([art.frame, art.label]);
    return { index, output, x: 0, y: 0, nx: 0, ny: -1, color, active, art };
  }

  private configureRound() {
    this.goals.forEach(g => { g.art.frame.destroy(); g.art.label.destroy(); }); this.goals = [];
    const challenge = this.match.challenge;
    const activeSlots = challenge.goals === 4 ? [4, 0, 1, 3] : [0, 1, 2, 3, 4, 5];
    for (let slot = 0; slot < 6; slot++) {
      const choice = activeSlots.indexOf(slot), active = !challenge.orbit && choice >= 0;
      this.goals.push(this.makeGoal(slot, active ? challenge.choices[choice] : '', active));
    }
    if (challenge.orbit) for (let i = 0; i < 4; i++) this.goals.push(this.makeGoal(i, challenge.choices[i], true));
    this.openGoalSides = new Set(challenge.orbit ? [] : this.goals.filter(g => g.active).map(g => g.index));
    this.obstacles = createObstacles(challenge.obstacles);
    this.bot = challenge.bot ? { x: 300 + Math.random() * 60, y: -250, vx: 0, vy: 0, radius: 25 } : undefined;
    this.botClock = 0; this.botPhase = 'quiet'; this.botCarrying = false; this.pitCooldown = 0;
    this.botView.view.setVisible(false);
    this.useRoundPitch();
    this.moveGoals(); this.resetPositions(true, this.introDone); this.drawObstacles();
    this.world.sort('depth');
  }

  private useRoundPitch() {
    const next = this.match.round === 0 ? 'alpine' : this.pitchStyle;
    this.atmosphere.style = next;
    if (next === this.activePitchStyle && this.pitch) return;
    this.activePitchStyle = next;
    this.pitch.destroy();
    this.pitch = makePitch(this, this.activePitchStyle);
    this.world.addAt(this.pitch, 0);
  }

  private advanceSpawn(dt: number) {
    if (this.spawnElapsed >= 1) return;
    this.spawnElapsed = Math.min(1, this.spawnElapsed + dt);
    const fall = Math.min(1, this.spawnElapsed / .6);
    const bounce = Math.max(0, (this.spawnElapsed - .6) / .4);
    this.spawnLift = this.controls.reducedMotion ? 0 : fall < 1 ? 100 * (1 - fall * fall) : Math.sin(bounce * Math.PI) * 14;
    this.ball.x = Math.cos(this.spawnAngle) * bounce * 26;
    this.ball.y = Math.sin(this.spawnAngle) * bounce * 26;
  }

  private resetPositions(countdown = false, zoom = false) {
    this.botCarrying = false; this.botClock = 0; this.botPhase = 'quiet'; this.botView.view.setVisible(false);
    this.botBallProtected = false;
    this.botPickupBlockedUntil = 0;
    Object.assign(this.player, { x: 0, y: 190, vx: 0, vy: 0 });
    Object.assign(this.ball, { x: 0, y: 0, vx: 0, vy: 0 });
    this.spawnElapsed = 0; this.spawnAngle = Math.random() * Math.PI * 2; this.spawnLift = this.controls.reducedMotion ? 0 : 100;
    this.facing = -Math.PI / 2; this.lastKick = -100; this.goalTouch = false; this.ballHop = 0;
    this.trails = []; this.ballTrail = []; this.ballTravel = { x: 0, y: 0 }; this.steering = 0;
    this.portal = { x: 0, y: 0, age: 0, duration: this.controls.reducedMotion ? .25 : 1.2 };
    this.roundZoom = zoom && !this.controls.reducedMotion ? ROUND_ZOOM_TIME : 0;
    this.countdown = countdown ? COUNTDOWN_TIME : 0;
    this.controls.kickDisabled = this.match.challenge.orbit || this.match.kicksRemaining <= 0 || this.countdown > 0 || this.roundZoom > 0;
    this.cameraState = this.roundZoom > 0 ? { x: 0, y: 0, zoom: .32 } : { ...followTarget(this.player, this.ball, this.facing), zoom: this.controls.reducedMotion ? 1.08 : 1.10 };
    this.updateCamera(0); this.renderBodies(0); this.renderEffects(0);
  }

  private moveGoals() {
    this.goals.forEach((g, i) => {
      if (this.match.challenge.orbit && i >= 6) {
        const angle = (i - 6) * Math.PI / 2 + this.elapsed * .075;
        g.nx = Math.cos(angle); g.ny = Math.sin(angle); g.x = g.nx * ORBIT_RADIUS; g.y = g.ny * ORBIT_RADIUS;
      } else {
        const s = SIDES[g.index]; g.nx = s.nx; g.ny = s.ny; g.x = s.nx * APOTHEM; g.y = s.ny * APOTHEM;
      }
      g.art.frame.setPosition(g.x, g.y).setRotation(Math.atan2(g.ny, g.nx) - Math.PI / 2);
      g.art.label.setPosition(g.x + g.nx * 49, g.y + g.ny * 49);
    });
  }

  private kick() {
    if (this.elapsed - this.lastAttempt < .32) return;
    this.lastAttempt = this.elapsed;
    if (this.match.challenge.orbit) { this.options.onFeedback({ text: 'NO KICK IN ORBIT MODE', kind: 'info', detail: 'Use the car body and timing to guide the ball.' }); return; }
    if (this.match.kicksRemaining <= 0) { this.options.onFeedback({ text: 'NO KICKS LEFT', kind: 'info', detail: 'Use your car to push the ball into the right output.' }); return; }
    if (Math.hypot(this.player.x - this.ball.x, this.player.y - this.ball.y) > 94) { this.options.onFeedback({ text: 'GET CLOSER', kind: 'info', detail: 'Kick when the ball is beside your car.' }); return; }
    this.match.kickCount++;
    this.controls.kickDisabled = this.match.challenge.orbit || this.match.kicksRemaining <= 0;
    this.botCarrying = false;
    this.botBallProtected = false;
    this.ball.vx = Math.cos(this.facing) * 940 + this.player.vx * .18;
    this.ball.vy = Math.sin(this.facing) * 940 + this.player.vy * .18;
    this.lastKick = this.elapsed; this.ballHop = 1;
    this.options.audio.play('kick'); this.burst(this.ball.x, this.ball.y, 0x91eaff, 12);
    this.ripples.push({ x: this.ball.x, y: this.ball.y, age: 0, color: 0x87e9ff, size: 75 });
  }

  private scoreGoal(goal: Goal) {
    if (this.goalTouch || this.transition > 0 || this.match.levelComplete || this.botCarrying || this.botBallProtected) return;
    this.goalTouch = true;
    const code = [...this.match.challenge.code];
    const outcome = this.match.goal(goal.output, this.elapsed - this.lastKick < 3.2);
    this.transition = outcome.kind === 'wrong' ? 1.55 : 2.3;
    this.pendingNext = outcome.kind === 'correct';
    this.ball.vx = 0; this.ball.vy = 0; this.player.vx = 0; this.player.vy = 0;
    if (outcome.kind === 'wrong') {
      this.options.onFeedback({ text: 'WRONG OUTPUT', kind: 'wrong', id: this.elapsed, detail: `${outcome.earned} XP · Read it again. You’ve got another shot.` });
      this.options.audio.play('wrong'); this.burst(this.ball.x, this.ball.y, 0xff7c86, 20);
    } else {
      const phase = outcome.kind === 'phase';
      this.options.onFeedback({ text: phase ? 'FIRST OUTPUT COMPLETE ✓' : 'PYTHON EXECUTED ✓', kind: 'correct', id: this.elapsed, code, output: goal.output, detail: phase ? 'Now read the next line.' : `+${outcome.earned} XP${this.elapsed - this.lastKick < 3.2 ? ' · CLEAN SHOT' : ''}` });
      this.atmosphere.cheer = 2.3;
      this.options.audio.play(outcome.kind === 'complete' ? 'complete' : 'goal'); this.burst(this.ball.x, this.ball.y, goal.color, 55);
      this.ripples.push({ x: goal.x, y: goal.y, age: 0, color: goal.color, size: 170 });
      if (!this.controls.reducedMotion) this.cameras.main.shake(130, .0015);
    }
    this.options.onSnapshot(this.match.snapshot());
  }

  private burst(x: number, y: number, color: number, count: number) {
    if (this.controls.reducedMotion) count = Math.min(count, 4);
    for (let i = 0; i < count && this.sparks.length < 110; i++) { const a = Math.random() * Math.PI * 2, speed = 45 + Math.random() * 180; this.sparks.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .45 + Math.random() * .5, color }); }
  }

  update(_time: number, delta: number) {
    if (!this.car) return;
    this.applyGarage();
    if (this.controls.paused) { this.accumulator = 0; return; }
    const wallDt = delta / 1000, dt = Math.min(wallDt, .2);
    if (!this.introDone) {
      this.introElapsed += wallDt;
      const duration = this.controls.reducedMotion ? .85 : 2.8;
      const t = Phaser.Math.Clamp((this.introElapsed - .8) / 2, 0, 1), ease = t * t * (3 - 2 * t);
      const target = followTarget(this.player, this.ball, this.facing);
      this.cameraState = this.controls.reducedMotion ? { x: 0, y: 0, zoom: .32 } : { x: target.x * ease, y: target.y * ease, zoom: .32 + .78 * ease };
      this.updateCamera(0); this.guidance.root.setVisible(false);
      this.atmosphere.update(dt, this.introElapsed, this.cameraState, this.controls.reducedMotion);
      if (this.introElapsed >= duration || this.controls.skipIntro) {
        this.introDone = true; this.controls.kickRequested = false;
        this.roundZoom = 0; this.countdown = COUNTDOWN_TIME; this.portal.age = 0;
        if (this.controls.reducedMotion) { this.cameraState = { ...followTarget(this.player, this.ball, this.facing), zoom: 1.08 }; this.updateCamera(0); }
        this.controls.kickDisabled = true; this.guidance.root.setVisible(true); this.options.onIntroComplete();
      }
      return;
    }
    this.elapsed += dt;
    this.portal.age += wallDt;
    if (this.roundZoom > 0) {
      this.roundZoom = Math.max(0, this.roundZoom - wallDt);
      const t = Phaser.Math.Clamp(1 - this.roundZoom / ROUND_ZOOM_TIME, 0, 1), ease = t * t * (3 - 2 * t);
      const target = followTarget(this.player, this.ball, this.facing);
      this.cameraState = { x: target.x * ease, y: target.y * ease, zoom: .32 + .78 * ease };
      this.controls.kickRequested = false; this.controls.kickDisabled = true; this.guidance.root.setVisible(false);
      this.updateCamera(0); this.drawObstacles(); this.renderBodies(dt); this.renderEffects(dt);
      this.atmosphere.update(wallDt, this.elapsed, this.cameraState, this.controls.reducedMotion);
      return;
    }
    this.advanceSpawn(wallDt);
    if (this.countdown > 0) {
      this.countdown = Math.max(0, this.countdown - wallDt);
      this.controls.kickRequested = false; this.controls.kickDisabled = true; this.guidance.root.setVisible(false);
      if (this.countdown <= 0) {
        this.guidance.root.setVisible(true);
        this.controls.kickDisabled = this.match.challenge.orbit || this.match.kicksRemaining <= 0;
        this.options.onSnapshot(this.match.snapshot());
      }
      this.updateCamera(dt); this.drawObstacles(); this.renderBodies(dt); this.renderEffects(dt);
      this.atmosphere.update(wallDt, this.elapsed, this.cameraState, this.controls.reducedMotion);
      return;
    }
    if (this.spawnElapsed < 1) {
      this.controls.kickRequested = false; this.controls.kickDisabled = true;
      this.renderBodies(dt); this.renderEffects(dt); return;
    }
    this.controls.kickDisabled = this.match.challenge.orbit || this.match.kicksRemaining <= 0;
    if (this.controls.kickRequested) { this.controls.kickRequested = false; if (!this.match.levelComplete && this.transition <= 0) this.kick(); }
    this.moveGoals();
    if (this.transition > 0) {
      this.transition -= wallDt;
      if (this.transition <= 0 && !this.match.levelComplete) {
        if (this.pendingNext) { this.match.nextRound(); this.configureRound(); this.options.onFeedback({ text: this.match.challenge.category, kind: 'info', detail: this.match.challenge.lesson }); }
        else this.resetPositions(false, false);
        this.options.onSnapshot(this.match.snapshot());
      }
    } else if (!this.match.levelComplete) {
      this.match.tick(wallDt); this.botClock += wallDt * (1 + Math.max(0, this.match.round - 4) * .08); this.accumulator += dt;
      while (this.accumulator >= 1 / 120) { this.step(1 / 120); this.accumulator -= 1 / 120; }
    }
    this.updateCamera(dt); this.drawObstacles(); this.renderBodies(dt); this.renderEffects(dt);
    this.atmosphere.update(wallDt, this.elapsed, this.cameraState, this.controls.reducedMotion);
    this.hudElapsed += dt;
    if (this.hudElapsed >= .1) { this.hudElapsed = 0; this.options.onSnapshot(this.match.snapshot()); }
  }

  private step(dt: number) {
    if (this.transition > 0 || this.match.levelComplete) return;
    let x = this.controls.x, y = this.controls.y;
    const kx = Number(this.keyboard.D.isDown || this.keyboard.RIGHT.isDown) - Number(this.keyboard.A.isDown || this.keyboard.LEFT.isDown);
    const ky = Number(this.keyboard.S.isDown || this.keyboard.DOWN.isDown) - Number(this.keyboard.W.isDown || this.keyboard.UP.isDown);
    if (kx || ky) { const m = Math.hypot(kx, ky); x = kx / m; y = ky / m; }
    const magnitude = Math.min(1, Math.hypot(x, y));
    if (magnitude > .06) {
      const difference = Phaser.Math.Angle.Wrap(Math.atan2(y, x) - this.facing);
      this.facing = Phaser.Math.Angle.Wrap(this.facing + Phaser.Math.Clamp(difference, -8.5 * dt, 8.5 * dt));
      this.steering = Phaser.Math.Clamp(difference, -.65, .65);
    } else this.steering *= Math.exp(-dt * 8);
    const wantsBoost = this.controls.boost || this.keyboard.SHIFT.isDown;
    if (!wantsBoost || this.boostEnergy >= .3) this.boostExhausted = false;
    if (this.boostEnergy <= .05) this.boostExhausted = true;
    const boost = wantsBoost && !this.boostExhausted && magnitude > .05;
    this.boostEnergy = Phaser.Math.Clamp(this.boostEnergy + (boost ? -.36 : .27) * dt, 0, 1);
    if (boost && !this.boostHeld) this.options.audio.play('boost'); this.boostHeld = boost;
    let speed = boost ? 590 : 330;
    for (const o of this.obstacles) if (Math.hypot(this.player.x - o.x, this.player.y - o.y) < o.radius) { if (o.kind === 'slow-zone') speed *= .45; if (o.kind === 'speed-pad') speed *= 1.4; }
    const fx = Math.cos(this.facing), fy = Math.sin(this.facing);
    let forward = this.player.vx * fx + this.player.vy * fy;
    let sideways = -this.player.vx * fy + this.player.vy * fx;
    forward += (speed * magnitude - forward) * (1 - Math.exp(-dt * (magnitude > .05 ? 5.8 : 7)));
    sideways *= Math.exp(-dt * (boost ? 4.2 : 8.5) * surfaces[this.activePitchStyle].grip);
    this.player.vx = forward * fx - sideways * fy; this.player.vy = forward * fy + sideways * fx;
    this.player.x += this.player.vx * dt; this.player.y += this.player.vy * dt;
    const dx = this.ball.vx * dt, dy = this.ball.vy * dt;
    this.ball.x += dx; this.ball.y += dy; this.ballTravel.x += dx; this.ballTravel.y += dy;
    const ballSpeed = Math.hypot(this.ball.vx, this.ball.vy);
    if (ballSpeed > 0) {
      const surface = surfaces[this.activePitchStyle];
      const speedAfter = Math.min(1100, Math.max(0, ballSpeed * Math.exp(-dt * surface.drag) - surface.rolling * dt));
      this.ball.vx *= speedAfter / ballSpeed; this.ball.vy *= speedAfter / ballSpeed;
    }
    if (collideCircles(this.player, this.ball, boost ? 1.2 : 1)) {
      if (this.botBallProtected) this.lastKick = -100;
      this.botCarrying = false; this.botBallProtected = false;
      this.botPickupBlockedUntil = this.elapsed + .6;
      if (this.elapsed - this.lastBump > .22) this.impact(this.ball.x, this.ball.y, 0x97e3e4);
    }
    for (const o of this.obstacles) {
      updateObstacle(o, this.elapsed, dt);
      if (!o.active || o.kind === 'slow-zone' || o.kind === 'speed-pad') continue;
      if (o.kind === 'pothole') {
        for (const body of [this.player, ...(this.botCarrying ? [] : [this.ball])]) if (this.elapsed > this.pitCooldown && Math.hypot(body.x - o.x, body.y - o.y) < 29) {
          const angle = Math.atan2(-o.y, -o.x);
          body.x = o.x + Math.cos(angle) * 80; body.y = o.y + Math.sin(angle) * 80;
          body.vx = Math.cos(angle) * 230; body.vy = Math.sin(angle) * 230;
          this.pitCooldown = this.elapsed + 1.5; this.ballHop = body === this.ball ? 1 : this.ballHop;
          this.burst(o.x, o.y, 0xffcd80, 12);
          this.options.onFeedback({ text: 'POP! BACK IN PLAY', kind: 'info', detail: 'The repair pit gives you a gentle bounce. No XP lost.' });
        }
        continue;
      }
      for (const body of [this.player, ...(this.botCarrying ? [] : [this.ball])]) {
        if (o.kind === 'bumper' || o.kind === 'orbiting-bumper') {
          const dx = body.x - o.x, dy = body.y - o.y, d = Math.hypot(dx, dy), radius = o.radius + body.radius;
          if (d < radius) {
            const nx = d > .001 ? dx / d : 1, ny = d > .001 ? dy / d : 0;
            body.x = o.x + nx * radius; body.y = o.y + ny * radius;
            body.vx = nx * (body === this.ball ? 470 : 190); body.vy = ny * (body === this.ball ? 470 : 190);
            if (body === this.ball && this.elapsed - this.lastBump > .22) { this.ballHop = .8; this.impact(o.x, o.y, 0xffd27c); }
          }
        } else if (collideWall(body, o.x, o.y, o.width, o.height, o.angle, o.vx, o.vy) && body === this.ball && this.elapsed - this.lastBump > .22) this.impact(body.x, body.y, 0x90d8ed);
      }
    }
    this.stepBot(dt);
    for (const goal of this.goals) {
      if (!goal.active) continue;
      for (const sign of [-1, 1]) {
        const x = goal.x - goal.ny * GOAL_HALF_WIDTH * sign, y = goal.y + goal.nx * GOAL_HALF_WIDTH * sign;
        if (collidePost(this.ball, x, y) && this.elapsed - this.lastBump > .22) this.impact(x, y, goal.color);
        collidePost(this.player, x, y);
      }
      if (this.match.challenge.orbit) {
        const angle = Math.atan2(goal.ny, goal.nx) - Math.PI / 2;
        for (const body of [this.player, this.ball]) {
          collideWall(body, goal.x + goal.nx * GOAL_DEPTH, goal.y + goal.ny * GOAL_DEPTH, GOAL_HALF_WIDTH * 2, 8, angle);
          for (const sign of [-1, 1]) collideWall(body, goal.x + goal.nx * GOAL_DEPTH / 2 - goal.ny * GOAL_HALF_WIDTH * sign, goal.y + goal.ny * GOAL_DEPTH / 2 + goal.nx * GOAL_HALF_WIDTH * sign, 8, GOAL_DEPTH, angle);
        }
        const bx = this.ball.x - goal.x, by = this.ball.y - goal.y;
        const across = -bx * goal.ny + by * goal.nx, deep = bx * goal.nx + by * goal.ny;
        if (deep >= this.ball.radius * .5 && deep < GOAL_DEPTH && Math.abs(across) < GOAL_HALF_WIDTH - this.ball.radius - 10) { this.scoreGoal(goal); break; }
      } else if (crossedGoal(this.ball, goal.index)) { this.scoreGoal(goal); break; }
    }
    const oldVX = this.ball.vx, oldVY = this.ball.vy;
    contain(this.player, .12); contain(this.ball, .78, this.botBallProtected ? undefined : this.openGoalSides);
    if (Math.hypot(this.ball.vx - oldVX, this.ball.vy - oldVY) > 160 && this.elapsed - this.lastBump > .22) this.impact(this.ball.x, this.ball.y, 0xa4d6cc);
  }

  private stepBot(dt: number) {
    if (!this.bot) return;
    let phase = tricksterPhase(this.botClock);
    if (this.botCarrying) phase = this.botCarryElapsed >= 8 ? 'quiet' : 'active';
    // A slow frame must never skip the warning and spawn a rover without notice.
    if (phase === 'active' && this.botPhase === 'quiet') { this.botClock = Math.floor(this.botClock / 16) * 16 + 6; phase = 'warning'; }
    if (phase !== this.botPhase) {
      if (phase === 'warning') {
        const angle = this.botClock * .7;
        Object.assign(this.bot, { x: this.ball.x + Math.cos(angle) * 160, y: this.ball.y + Math.sin(angle) * 160, vx: 0, vy: 0 }); contain(this.bot, 0);
        this.botPortal = { x: this.bot.x, y: this.bot.y };
        this.options.onFeedback({ text: 'PORTAL ROVER INCOMING', kind: 'info', detail: 'Keep the ball moving!' });
      }
      if (phase === 'active') this.burst(this.bot.x, this.bot.y, 0xc799ff, 20);
      if (phase === 'quiet') {
        if (this.botCarrying) {
          this.ball.vx = 0; this.ball.vy = 0;
          this.botClock = Math.floor(this.botClock / 16) * 16 + 10;
          this.ballTravel = { x: 0, y: 0 }; this.ballTrail = []; this.ballHop = 0;
        }
        this.botCarrying = false; this.burst(this.bot.x, this.bot.y, 0xc799ff, 20);
      }
      this.botPhase = phase;
    }
    this.botView.view.setVisible(phase === 'active');
    if (phase !== 'active') return;
    const tx = this.botCarrying ? this.botDestination.x : this.ball.x, ty = this.botCarrying ? this.botDestination.y : this.ball.y;
    const dx = tx - this.bot.x, dy = ty - this.bot.y, d = Math.hypot(dx, dy) || 1;
    const speed = (210 + Math.max(0, this.match.round - 4) * 12) * Math.min(1, d / 50);
    this.bot.vx += (dx / d * speed - this.bot.vx) * dt * 4; this.bot.vy += (dy / d * speed - this.bot.vy) * dt * 4;
    this.bot.x += this.bot.vx * dt; this.bot.y += this.bot.vy * dt;
    if (d < 60 && !this.botCarrying && this.elapsed - this.lastKick > .6 && this.elapsed >= this.botPickupBlockedUntil) {
      this.botCarrying = true; this.botBallProtected = true; this.lastKick = -100;
      this.botCarryElapsed = 0;
      const origin = Math.hypot(this.ball.x, this.ball.y) > 60 ? this.ball : this.player;
      const angle = Math.atan2(-origin.y, -origin.x);
      const radius = this.match.challenge.orbit ? ORBIT_RADIUS - 130 : APOTHEM * .7;
      this.botDestination = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }
    if (this.botCarrying) {
      this.botCarryElapsed += dt;
      const a = Math.atan2(this.bot.vy, this.bot.vx), x = this.bot.x + Math.cos(a) * 48, y = this.bot.y + Math.sin(a) * 48;
      this.ballTravel.x += x - this.ball.x; this.ballTravel.y += y - this.ball.y;
      this.ball.x = x; this.ball.y = y; this.ball.vx = 0; this.ball.vy = 0;
      contain(this.ball, 0);
      if (Math.hypot(this.botDestination.x - this.bot.x, this.botDestination.y - this.bot.y) < 30) {
        Object.assign(this.ball, this.botDestination);
        this.botCarryElapsed = 8;
        this.stepBot(0);
      }
    }
    contain(this.bot, .3);
  }

  private applyGarage() {
    const settings = this.controls.settings; if (!settings) return;
    const key = `${settings.paint}-${settings.decal}`;
    this.trailColor = parseInt(trails.find(t => t.id === settings.trail)!.color.slice(1), 16);
    if (key === this.carKey) return;
    this.carKey = key; this.car.view.destroy();
    this.car = makeCarArt(this, parseInt(paints.find(p => p.id === settings.paint)!.color.slice(1), 16), settings.decal);
    this.car.view.setPosition(this.player.x, this.player.y).setRotation(this.facing);
    this.world.add(this.car.view); this.world.sort('depth');
  }

  private impact(x: number, y: number, color: number) {
    this.lastBump = this.elapsed; this.options.audio.play('hit'); this.burst(x, y, color, 7);
    this.ripples.push({ x, y, age: 0, color, size: 44 });
  }

  private updateCamera(dt: number) {
    if (dt > 0) this.cameraState = advanceCamera(this.cameraState, followTarget(this.player, this.ball, this.facing), Math.hypot(this.player.vx, this.player.vy), dt, this.controls.reducedMotion);
    this.cameras.main.setZoom(this.cameraState.zoom).centerOn(this.cameraState.x, this.cameraState.y);
    this.guidance.update(this.cameraState, this.player, this.ball, this.goals, this.facing, this.boostEnergy);
  }

  private renderBodies(dt: number) {
    const moving = Math.hypot(this.player.vx, this.player.vy) > 40;
    const vibration = moving && !this.controls.reducedMotion ? Math.sin(this.elapsed * 45) * .007 : 0;
    this.car.view.setPosition(this.player.x, this.player.y).setRotation(this.facing).setScale(1 + vibration, 1 - vibration);
    this.car.frontWheels.list.forEach(wheel => (wheel as Phaser.GameObjects.Graphics).setRotation(this.steering * .6));
    const e = this.car.exhaust; e.clear();
    if (moving) {
      const length = this.boostHeld ? 26 + Math.sin(this.elapsed * 35) * 8 : 7;
      for (const y of [-9, 6]) { e.fillStyle(this.trailColor, .4).fillTriangle(-36, y - 5, -36, y + 5, -39 - length, y); e.fillStyle(0xf1faff, .9).fillTriangle(-37, y - 2, -37, y + 2, -39 - length * .65, y); }
    }
    this.ballHop = Math.max(0, this.ballHop - dt * 2.8);
    const lift = this.controls.reducedMotion ? 0 : this.spawnLift + Math.sin(this.ballHop * Math.PI) * 6;
    this.ballArt.view.setPosition(this.ball.x, this.ball.y - lift).setScale(1 + lift * .008);
    this.ballArt.roll(this.ballTravel.x, this.ballTravel.y); this.ballTravel = { x: 0, y: 0 };
    if (this.bot) this.botView.view.setPosition(this.bot.x, this.bot.y).setRotation(Math.atan2(this.bot.vy, this.bot.vx));
  }

  private renderEffects(dt: number) {
    const g = this.groundFx, air = this.airFx; g.clear(); air.clear();
    const speed = Math.hypot(this.player.vx, this.player.vy);
    this.trailElapsed += dt;
    if (this.trailElapsed >= .025 && this.transition <= 0 && !this.match.levelComplete) {
      this.trailElapsed = 0;
      if (speed > 35 && !this.controls.reducedMotion) {
        const slip = Math.abs(-this.player.vx * Math.sin(this.facing) + this.player.vy * Math.cos(this.facing));
        this.trails.push({ x: this.player.x, y: this.player.y, facing: this.facing, age: 0, boost: this.boostHeld, skid: Math.min(1, slip / 80 + (this.boostHeld ? .4 : .04)) });
      }
      if (Math.hypot(this.ball.vx, this.ball.vy) > 180 && !this.controls.reducedMotion) this.ballTrail.push({ x: this.ball.x, y: this.ball.y, age: 0 });
    }
    this.trails.forEach(t => { t.age += dt; }); this.trails = this.trails.filter(t => t.age < 7).slice(-240);
    for (let i = 1; i < this.trails.length; i++) {
      const a = this.trails[i - 1], b = this.trails[i];
      if (Math.hypot(b.x - a.x, b.y - a.y) > 100) continue;
      for (const side of [-1, 1]) {
        const wheel = (t: Trail) => ({ x: t.x - Math.cos(t.facing) * 18 - Math.sin(t.facing) * 21 * side, y: t.y - Math.sin(t.facing) * 18 + Math.cos(t.facing) * 21 * side });
        const wa = wheel(a), wb = wheel(b);
        g.lineStyle(4, 0x061c18, (1 - b.age / 7) * b.skid * .48).lineBetween(wa.x, wa.y, wb.x, wb.y);
      }
      const life = b.boost ? .8 : .3;
      if (b.age < life) for (const side of [-1, 1]) {
        const exhaust = (t: Trail) => ({ x: t.x - Math.cos(t.facing) * 37 - Math.sin(t.facing) * 8 * side, y: t.y - Math.sin(t.facing) * 37 + Math.cos(t.facing) * 8 * side });
        const ea = exhaust(a), eb = exhaust(b), alpha = (1 - b.age / life) * (b.boost ? .65 : .24);
        g.lineStyle(b.boost ? 11 : 5, this.trailColor, alpha * .2).lineBetween(ea.x, ea.y, eb.x, eb.y);
        g.lineStyle(b.boost ? 4 : 2, this.trailColor, alpha).lineBetween(ea.x, ea.y, eb.x, eb.y);
      }
    }
    this.ballTrail.forEach(p => { p.age += dt; }); this.ballTrail = this.ballTrail.filter(p => p.age < .28).slice(-18);
    for (let i = 1; i < this.ballTrail.length; i++) { const a = this.ballTrail[i - 1], b = this.ballTrail[i]; if (Math.hypot(a.x - b.x, a.y - b.y) < 120) g.lineStyle(9, 0xc0f1ef, (1 - b.age / .28) * .12).lineBetween(a.x, a.y, b.x, b.y); }
    g.fillStyle(0x000b10, .35).fillEllipse(this.player.x + 5, this.player.y + 6, 64, 46);
    g.fillStyle(0x000b10, .33).fillEllipse(this.ball.x + 3, this.ball.y + 5, 36 + this.ballHop * 6, 28);
    for (let i = 3; i > 0; i--) g.fillStyle(0x81dcf2, .022 * i).fillCircle(this.ball.x, this.ball.y, 19 + i * 6);
    if (this.portal.age < this.portal.duration) {
      const p = Phaser.Math.Clamp(this.portal.age / this.portal.duration, 0, 1);
      const open = Math.sin(p * Math.PI);
      g.fillStyle(0x071423, .55).fillEllipse(this.portal.x + 5, this.portal.y + 7, 88 + open * 25, 38 + open * 14);
      air.lineStyle(5, 0x78e6ff, (1 - p) * .9).strokeEllipse(this.portal.x, this.portal.y, 88 + p * 70, 38 + p * 32);
      air.lineStyle(3, 0xffd079, (1 - p) * .75).lineBetween(this.portal.x - 42 - open * 18, this.portal.y, this.portal.x - 10, this.portal.y);
      air.lineStyle(3, 0xffd079, (1 - p) * .75).lineBetween(this.portal.x + 10, this.portal.y, this.portal.x + 42 + open * 18, this.portal.y);
    }
    if (this.introDone && this.roundZoom <= 0 && this.countdown > 0) {
      const value = Math.max(1, Math.ceil(this.countdown));
      const pulse = this.controls.reducedMotion ? 1 : 1 + (1 - this.countdown % 1) * .12;
      air.fillStyle(0x061421, .55).fillCircle(0, -36, 72 * pulse);
      air.lineStyle(4, 0x7fe7ff, .75).strokeCircle(0, -36, 76 * pulse);
      air.fillStyle(0xffffff, .95).fillCircle(0, -36, 2);
      this.countdownText.setText(String(value)).setScale(pulse).setVisible(true);
    } else {
      this.countdownText.setVisible(false);
    }
    const fx = Math.cos(this.facing), fy = Math.sin(this.facing);
    for (const side of [-1, 1]) {
      const x = this.player.x + fx * 32 - fy * side * 10, y = this.player.y + fy * 32 + fx * side * 10;
      g.fillStyle(0xd8f8ed, .045).fillTriangle(x, y, x + fx * 100 - fy * 18, y + fy * 100 + fx * 18, x + fx * 100 + fy * 18, y + fy * 100 - fx * 18);
    }
    if (this.bot && this.botPhase !== 'quiet') {
      const pulse = this.controls.reducedMotion ? 1 : 1 + Math.sin(this.elapsed * 7) * .12;
      g.fillStyle(0x583297, .22).fillCircle(this.botPortal.x, this.botPortal.y, 46 * pulse);
      g.lineStyle(3, 0xc38bff, .75).strokeCircle(this.botPortal.x, this.botPortal.y, 46 * pulse);
      if (this.botPhase === 'active') g.fillStyle(0x000b10, .3).fillEllipse(this.bot.x + 5, this.bot.y + 6, 64, 46);
    }
    if (this.activePitchStyle === 'worn' && speed > 180 && !this.controls.reducedMotion) for (let i = 1; i <= 5; i++) g.fillStyle(0xcfb68a, .035).fillCircle(this.player.x - Math.cos(this.facing) * (26 + i * 9), this.player.y - Math.sin(this.facing) * (26 + i * 9), 5 + i * 2);
    if (this.match.challenge.orbit) { g.lineStyle(1, 0xbed1eb, .14).strokeCircle(0, 0, ORBIT_RADIUS); g.lineStyle(1, 0xa290e8, .08).strokeCircle(0, 0, ORBIT_RADIUS + GOAL_DEPTH); }
    for (const spark of this.sparks) { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.life -= dt; spark.vx *= Math.exp(-dt * 2); spark.vy *= Math.exp(-dt * 2); air.fillStyle(spark.color, Math.max(0, spark.life)).fillCircle(spark.x, spark.y, 2.5); }
    this.sparks = this.sparks.filter(s => s.life > 0);
    for (const ripple of this.ripples) { ripple.age += dt; air.lineStyle(2, ripple.color, Math.max(0, 1 - ripple.age / .6) * .65).strokeCircle(ripple.x, ripple.y, ripple.size * ripple.age / .6); }
    this.ripples = this.ripples.filter(r => r.age < .6).slice(-12);
  }

  private drawObstacles() {
    const g = this.obstacleGraphics; g.clear();
    for (const o of this.obstacles) {
      if (!o.active && !o.warning) continue;
      if (o.kind === 'pothole') {
        if (o.warning) { g.lineStyle(3, 0xffc570, .65).strokeCircle(o.x, o.y, 49); continue; }
        g.fillStyle(0x14262d).fillCircle(o.x, o.y, 49); g.lineStyle(3, 0xffc570, .8).strokeCircle(o.x, o.y, 49);
        g.fillStyle(0x020b14).fillCircle(o.x, o.y, 37); g.lineStyle(4, 0x355361).strokeEllipse(o.x, o.y + 8, 59, 35);
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; g.lineStyle(4, 0xffc570, .6).lineBetween(o.x + Math.cos(a) * 42, o.y + Math.sin(a) * 42, o.x + Math.cos(a + .13) * 48, o.y + Math.sin(a + .13) * 48); }
        g.lineStyle(2, 0x7de4df, .55).strokeCircle(o.x, o.y, 16 + (this.controls.reducedMotion ? 0 : Math.sin(this.elapsed * 2) * 4));
      } else if (o.kind === 'bumper' || o.kind === 'orbiting-bumper') {
        g.fillStyle(0x041719, .4).fillCircle(o.x + 5, o.y + 7, o.radius + 5);
        g.fillStyle(0x21373c).fillCircle(o.x, o.y, o.radius + 4); g.lineStyle(3, 0x6d98a2).strokeCircle(o.x, o.y, o.radius + 2);
        g.fillStyle(0x13262d).fillCircle(o.x, o.y, o.radius - 2); g.lineStyle(3, 0xffc36a).strokeCircle(o.x, o.y, o.radius - 8);
        g.fillStyle(0xffd693).fillCircle(o.x, o.y, 9); g.fillStyle(0xffe7c0).fillCircle(o.x - 3, o.y - 3, 3);
        for (let a = 0; a < 6; a++) { const angle = a * Math.PI / 3; g.fillStyle(0x9ac9cb).fillCircle(o.x + Math.cos(angle) * o.radius, o.y + Math.sin(angle) * o.radius, 2); }
      } else if (o.kind === 'slow-zone' || o.kind === 'speed-pad') {
        const color = o.kind === 'slow-zone' ? 0x9473d3 : 0x40d7e9;
        g.fillStyle(color, .14).fillCircle(o.x, o.y, o.radius); g.lineStyle(2, color, .6).strokeCircle(o.x, o.y, o.radius);
      } else {
        const c = Math.cos(o.angle), s = Math.sin(o.angle);
        const points = [[-o.width / 2, -o.height / 2], [o.width / 2, -o.height / 2], [o.width / 2, o.height / 2], [-o.width / 2, o.height / 2]].map(([x, y]) => ({ x: o.x + x * c - y * s, y: o.y + x * s + y * c }));
        if (o.warning) { g.fillStyle(0xffc86b, .14 + (this.controls.reducedMotion ? 0 : Math.sin(this.elapsed * 10) * .05)).fillPoints(points, true); g.lineStyle(2, 0xffcc78, .8).strokePoints(points, true); continue; }
        g.fillStyle(0x041619, .4).fillPoints(points.map(p => ({ x: p.x + 5, y: p.y + 7 })), true); g.fillStyle(0x28424c).fillPoints(points, true); g.lineStyle(3, 0x496d76).strokePoints(points, true);
        const color = o.kind === 'disappearing-wall' ? 0xc493ff : 0x55c9fa;
        g.lineStyle(3, color).lineBetween(points[0].x, points[0].y, points[1].x, points[1].y); g.lineStyle(2, color, .45).lineBetween(points[2].x, points[2].y, points[3].x, points[3].y);
        for (let x = -o.width / 2 + 17; x < o.width / 2; x += 25) {
          const ax = o.x + x * c, ay = o.y + x * s;
          g.lineStyle(2, 0xaabda9, .55).lineBetween(ax + s * 8, ay - c * 8, ax - s * 8 + c * 5, ay + c * 8 + s * 5);
        }
      }
    }
  }
}
