export const paints = [
  { id: 'azure', name: 'Azure sprint', color: '#1baef4' },
  { id: 'coral', name: 'Coral comet', color: '#ff716b' },
  { id: 'mint', name: 'Mint circuit', color: '#5de2ab' },
  { id: 'violet', name: 'Violet voltage', color: '#b48aff' },
] as const;
export const trails = [
  { id: 'ion', name: 'Ion blue', color: '#71e4ff' },
  { id: 'solar', name: 'Solar gold', color: '#ffd079' },
  { id: 'plasma', name: 'Pink plasma', color: '#ff8dde' },
] as const;
export const decals = ['crown', 'stripes', 'bolt'] as const;
export const pitches = [
  { id: 'shuffle', name: 'Surprise me', description: 'A different atmosphere each match.' },
  { id: 'alpine', name: 'Alpine lights', description: 'Fresh turf. Familiar, balanced grip.' },
  { id: 'rain', name: 'Midnight rain', description: 'Rain streaks, puddles, a little more drift.' },
  { id: 'ice', name: 'Polar circuit', description: 'Frosted glass and longer, graceful slides.' },
  { id: 'worn', name: 'Sunday league', description: 'Sun-worn grass, dust, and a lively crowd.' },
] as const;
export type PitchStyle = 'alpine' | 'rain' | 'ice' | 'worn';
export const surfaces: Record<PitchStyle, { grip: number; drag: number; rolling: number }> = {
  alpine: { grip: 1, drag: .58, rolling: 22 }, rain: { grip: .8, drag: .54, rolling: 23 },
  ice: { grip: .56, drag: .36, rolling: 15 }, worn: { grip: 1.06, drag: .65, rolling: 27 },
};
export function selectPitch(preference: string, random = Math.random): PitchStyle {
  if (preference in surfaces) return preference as PitchStyle;
  return (['alpine', 'rain', 'ice', 'worn'] as const)[Math.min(3, Math.floor(random() * 4))];
}
