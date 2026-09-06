import type { MatchSnapshot } from './match';
import type { GameAudio } from './audio';
import type { Settings } from '../data/storage';
export { ArenaScene } from './DrivingScene';

export interface Controls { x: number; y: number; boost: boolean; kick: boolean; kickRequested: boolean; paused: boolean; reducedMotion: boolean; settings?: Settings; skipIntro?: boolean; kickDisabled?: boolean }
export interface Feedback { text: string; kind: 'correct' | 'wrong' | 'info'; detail?: string; code?: string[]; output?: string; id?: number }
export interface ArenaOptions { controls: Controls; audio: GameAudio; onSnapshot: (state: MatchSnapshot) => void; onFeedback: (feedback: Feedback) => void; onReady: () => void; onIntroComplete: () => void }
