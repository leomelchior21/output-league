export class GameAudio {
  private context?: AudioContext;
  enabled = true;
  unlock() { if (!this.enabled) return; try { this.context ??= new AudioContext(); void this.context.resume().catch(() => {}); } catch { /* Audio is optional. */ } }
  play(kind: 'kick' | 'goal' | 'wrong' | 'boost' | 'hit' | 'complete') {
    if (!this.enabled || !this.context || this.context.state !== 'running') return;
    if (kind === 'goal' || kind === 'complete') {
      const ctx = this.context, duration = kind === 'complete' ? 2 : 1.6;
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * duration), ctx.sampleRate), samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * (.65 + .35 * Math.sin(i / ctx.sampleRate * 22));
      const crowd = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
      crowd.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 880; filter.Q.value = .5;
      const now = ctx.currentTime; gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.16, now + .16); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
      crowd.connect(filter); filter.connect(gain); gain.connect(ctx.destination); crowd.start();
      crowd.onended = () => { crowd.disconnect(); filter.disconnect(); gain.disconnect(); };
    }
    const notes = kind === 'goal' ? [523, 659, 784] : kind === 'complete' ? [523, 659, 784, 1047] : kind === 'wrong' ? [145, 110] : kind === 'kick' ? [220, 440] : kind === 'boost' ? [120, 200] : [180];
    notes.forEach((frequency, i) => {
      const ctx = this.context!; const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = kind === 'wrong' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
      const start = ctx.currentTime + i * .075;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.065, start + .012); gain.gain.exponentialRampToValueAtTime(.001, start + .19);
      oscillator.connect(gain); gain.connect(ctx.destination); oscillator.start(start); oscillator.stop(start + .2);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    });
  }
  destroy() { void this.context?.close().catch(() => {}); }
}
