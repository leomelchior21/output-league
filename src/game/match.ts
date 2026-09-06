import { makeRounds, type Challenge } from '../data/challenges';
export interface Breakdown { roundXP: number; accuracy: number; cleanShot: number; streak: number; special: number; mastery: number; penalties: number }
export const KICKS_PER_ROUND = 3;
export interface MatchSnapshot { round: number; score: number; streak: number; potentialXP: number; phase: number; wrongGoalsThisRound: number; kickCount: number; kicksRemaining: number; roundStartTime: number; challenge: Challenge; targetOutput: string; specialMode: boolean; levelComplete: boolean; totalWrong: number; cleanShots: number; breakdown: Breakdown; stars: number }
export function potentialXP(elapsed: number, tutorial = false) { return Math.max(60, Math.round(300 - Math.max(0, elapsed - (tutorial ? 8 : 3)) * (tutorial ? 4 : 7))); }
export class Match {
  rounds: Challenge[];
  round = 0; score = 0; streak = 0; phase = 0; elapsed = 0; wrongGoalsThisRound = 0; totalWrong = 0; kickCount = 0; cleanShots = 0; levelComplete = false; roundStartTime = 0;
  breakdown: Breakdown = { roundXP: 0, accuracy: 0, cleanShot: 0, streak: 0, special: 0, mastery: 0, penalties: 0 };
  constructor(rounds = makeRounds()) { this.rounds = rounds; }
  get challenge() { return this.rounds[this.round]; }
  get targetOutput() { return this.challenge.outputs[this.phase]; }
  get xp() { return potentialXP(this.elapsed, this.round === 0); }
  tick(seconds: number) { if (!this.levelComplete) this.elapsed += seconds; }
  goal(output: string, clean: boolean): { kind: 'wrong' | 'phase' | 'correct' | 'complete'; earned: number } {
    if (this.levelComplete) return { kind: 'complete', earned: 0 };
    if (output !== this.targetOutput) {
      const penalty = this.score;
      this.score -= penalty; this.breakdown.penalties += penalty;
      this.wrongGoalsThisRound++; this.totalWrong++; this.streak = 0;
      return { kind: 'wrong', earned: -penalty };
    }
    if (this.phase < this.challenge.outputs.length - 1) { this.phase++; return { kind: 'phase', earned: 0 }; }
    const accuracy = this.wrongGoalsThisRound === 0 ? 40 : 0;
    // A recovered round earns XP, but does not rebuild an accuracy streak.
    if (this.wrongGoalsThisRound === 0) this.streak++;
    const streak = Math.min(this.streak, 5) * 15;
    const special = this.challenge.orbit ? 40 : 0;
    const mastery = this.challenge.outputs.length > 1 ? 100 : 0;
    const cleanShot = clean ? 20 : 0;
    if (clean) this.cleanShots++;
    const earned = this.xp + accuracy + streak + special + mastery + cleanShot;
    this.breakdown.roundXP += this.xp; this.breakdown.accuracy += accuracy; this.breakdown.streak += streak;
    this.breakdown.special += special; this.breakdown.mastery += mastery; this.breakdown.cleanShot += cleanShot;
    this.score += earned;
    if (this.round === this.rounds.length - 1) { this.levelComplete = true; return { kind: 'complete', earned }; }
    return { kind: 'correct', earned };
  }
  get kicksRemaining() { return Math.max(0, KICKS_PER_ROUND - this.kickCount); }
  nextRound() { if (this.levelComplete) return; this.round++; this.phase = 0; this.roundStartTime += this.elapsed; this.elapsed = 0; this.wrongGoalsThisRound = 0; this.kickCount = 0; }
  get stars() {
    if (!this.levelComplete) return 0;
    const accuracy = 10 / (10 + this.totalWrong);
    const rating = accuracy * .5 + Math.min(1, this.score / 3600) * .35 + Math.min(1, this.cleanShots / 7) * .15;
    return rating >= .81 && this.totalWrong <= 2 ? 3 : rating >= .57 && this.totalWrong <= 7 ? 2 : 1;
  }
  snapshot(): MatchSnapshot { return { round: this.round + 1, score: this.score, streak: this.streak, potentialXP: this.xp, phase: this.phase, wrongGoalsThisRound: this.wrongGoalsThisRound, kickCount: this.kickCount, kicksRemaining: this.kicksRemaining, roundStartTime: this.roundStartTime, challenge: this.challenge, targetOutput: this.targetOutput, specialMode: !!this.challenge.orbit, levelComplete: this.levelComplete, totalWrong: this.totalWrong, cleanShots: this.cleanShots, breakdown: { ...this.breakdown }, stars: this.stars }; }
}
