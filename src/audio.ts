// Tiny generated soundscape: crickets at night, a fire crackle that swells with
// suspicion, and a few one-shot cues. No audio files.

export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private crackle!: GainNode;
  private night!: GainNode;
  muted = false;

  /** Must be called from a user gesture. */
  start() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.7;
    this.master.connect(ctx.destination);

    // fire crackle: sparse clicks through a bandpass
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const pop = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : 0;
      d[i] = pop + (Math.random() * 2 - 1) * 0.05;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800;
    bp.Q.value = 0.6;
    this.crackle = ctx.createGain();
    this.crackle.gain.value = 0;
    src.connect(bp).connect(this.crackle).connect(this.master);
    src.start();

    // night ambience: soft filtered wind
    const wbuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const wd = wbuf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      wd[i] = last * 3;
    }
    const wsrc = ctx.createBufferSource();
    wsrc.buffer = wbuf;
    wsrc.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 500;
    this.night = ctx.createGain();
    this.night.gain.value = 0.25;
    wsrc.connect(lp).connect(this.night).connect(this.master);
    wsrc.start();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.1);
  }

  setSuspicion(v: number) {
    if (!this.ctx) return;
    this.crackle.gain.setTargetAtTime(Math.max(0, (v - 20) / 80) * 0.9, this.ctx.currentTime, 0.8);
  }

  /** Bell-like tone. */
  private tone(freq: number, when = 0, dur = 1.2, vol = 0.18, type: OscillatorType = "sine") {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Short pluck while text types out. */
  blip() {
    this.tone(520 + Math.random() * 120, 0, 0.06, 0.025, "triangle");
  }

  win() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, i * 0.09, 1.4, 0.12));
  }

  fail() {
    [392, 349.23, 311.13].forEach((f, i) => this.tone(f, i * 0.16, 1.1, 0.1, "triangle"));
  }

  alarm() {
    this.tone(220, 0, 0.5, 0.12, "sawtooth");
    this.tone(207.65, 0.12, 0.6, 0.1, "sawtooth");
  }

  bell() {
    [0, 0.9, 1.8].forEach((w) => {
      this.tone(196, w, 2.4, 0.16);
      this.tone(392.5, w, 1.6, 0.06);
    });
  }

  dawn() {
    [392, 493.88, 587.33, 783.99, 987.77].forEach((f, i) => this.tone(f, i * 0.18, 2.2, 0.09));
  }
}
