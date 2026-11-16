// Background canvas: dusk sky, a sleeping village, and torch-bearing villagers
// who gather on the hill as suspicion rises. Ends in flames or a sunrise.

interface Star { x: number; y: number; r: number; p: number }
interface House { x: number; w: number; h: number; roof: number; win: boolean; church?: boolean }
interface Ember { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number }

type Ending = null | "burn" | "dawn";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (c1: number[], c2: number[], t: number) =>
  `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(",")})`;

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export class Scene {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private stars: Star[] = [];
  private houses: House[] = [];
  private embers: Ember[] = [];
  private t0 = performance.now();
  /** Smoothed suspicion, 0..1. */
  private s = 0;
  target = 0;
  private ending: Ending = null;
  private endT = 0;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    addEventListener("resize", () => this.resize());
    requestAnimationFrame(this.frame);
  }

  setSuspicion(v: number) {
    this.target = Math.max(0, Math.min(1, v / 100));
  }

  setEnding(e: Ending) {
    this.ending = e;
    this.endT = performance.now();
    if (!e) this.embers = [];
  }

  private resize() {
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const r = rng(7);
    this.stars = Array.from({ length: Math.round((this.w * this.h) / 5200) }, () => ({
      x: r() * this.w,
      y: r() * this.h * 0.62,
      r: r() * 1.2 + 0.25,
      p: r() * Math.PI * 2,
    }));
    const hr = rng(42);
    this.houses = [];
    let x = -20;
    const churchAt = this.w * 0.62;
    while (x < this.w + 40) {
      const church = !this.houses.some((h) => h.church) && x > churchAt;
      const w = church ? 70 : 34 + hr() * 46;
      this.houses.push({ x, w, h: church ? 70 : 20 + hr() * 26, roof: church ? 90 : 14 + hr() * 18, win: hr() > 0.35, church });
      x += w + 6 + hr() * 30;
    }
  }

  private frame = (now: number) => {
    const t = (now - this.t0) / 1000;
    this.s += (this.target - this.s) * 0.04;
    this.draw(t, now);
    requestAnimationFrame(this.frame);
  };

  private horizon() {
    return this.h * (this.w < 760 ? 0.38 : 0.72);
  }

  private draw(t: number, now: number) {
    const { ctx, w, h } = this;
    const s = this.s;
    const endP = this.ending ? Math.min(1, (now - this.endT) / 2600) : 0;
    const dawn = this.ending === "dawn" ? endP : 0;
    const burn = this.ending === "burn" ? endP : 0;

    // sky
    const top = dawn ? mix([22, 18, 34], [92, 120, 168], dawn) : mix([16, 14, 28], [40, 8, 10], Math.max(s * 0.9, burn));
    const mid = dawn ? mix([58, 34, 52], [238, 170, 120], dawn) : mix([54, 30, 46], [120, 28, 14], Math.max(s, burn));
    const low = dawn ? mix([150, 74, 52], [255, 214, 150], dawn) : mix([128, 62, 44], [230, 90, 30], Math.max(s, burn));
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, top);
    g.addColorStop(0.55, mid);
    g.addColorStop(0.85, low);
    g.addColorStop(1, low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // stars
    const starA = (1 - s * 0.7) * (1 - dawn);
    if (starA > 0.02) {
      ctx.fillStyle = "#fff6e0";
      for (const st of this.stars) {
        ctx.globalAlpha = starA * (0.45 + 0.55 * Math.sin(t * 1.3 + st.p) ** 2);
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    // moon (or sun at dawn)
    const hz = this.horizon();
    const mx = w * 0.18;
    const my = h * 0.16;
    if (!dawn) {
      const halo = ctx.createRadialGradient(mx, my, 0, mx, my, 90);
      halo.addColorStop(0, `rgba(255,236,200,${0.35 - s * 0.2})`);
      halo.addColorStop(1, "rgba(255,236,200,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(mx - 90, my - 90, 180, 180);
      ctx.fillStyle = mix([255, 240, 214], [255, 140, 90], s);
      ctx.beginPath();
      ctx.arc(mx, my, 22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const sy = lerp(hz + 30, hz - 90, dawn);
      const sun = ctx.createRadialGradient(w * 0.7, sy, 0, w * 0.7, sy, 260);
      sun.addColorStop(0, "rgba(255,240,200,.95)");
      sun.addColorStop(0.15, "rgba(255,210,140,.6)");
      sun.addColorStop(1, "rgba(255,190,120,0)");
      ctx.fillStyle = sun;
      ctx.fillRect(0, 0, w, h);
    }

    // far hills
    ctx.fillStyle = dawn ? mix([40, 30, 44], [120, 104, 110], dawn) : mix([30, 22, 34], [40, 14, 14], s);
    this.hill(hz - 40, 46, 0.004, 1.3);
    // village
    this.village(hz, t, s, dawn);
    // near hill with the mob
    ctx.fillStyle = dawn ? mix([14, 12, 16], [56, 48, 46], dawn) : "#0d0a0b";
    this.hill(hz + 26, 30, 0.006, 4.1);
    ctx.fillRect(0, hz + 50, w, h);
    this.mob(hz + 26, t, Math.max(s, burn));

    // fire at the end
    if (burn > 0 || s > 0.75) this.fire(Math.max(burn, (s - 0.75) * 0.6));
  }

  private hill(base: number, amp: number, freq: number, phase: number) {
    const { ctx, w, h } = this;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w + 10; x += 10) {
      ctx.lineTo(x, base - Math.sin(x * freq + phase) * amp * 0.5 - Math.sin(x * freq * 2.7 + phase) * amp * 0.25);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  }

  private village(hz: number, t: number, s: number, dawn: number) {
    const { ctx } = this;
    const base = hz + 4;
    ctx.fillStyle = dawn ? mix([20, 16, 20], [80, 64, 62], dawn) : "#140f12";
    for (const hs of this.houses) {
      const y = base - hs.h;
      ctx.fillRect(hs.x, y, hs.w, hs.h + 30);
      ctx.beginPath();
      if (hs.church) {
        const cx = hs.x + hs.w / 2;
        ctx.moveTo(cx - 12, y);
        ctx.lineTo(cx, y - hs.roof);
        ctx.lineTo(cx + 12, y);
        ctx.fill();
        ctx.fillRect(cx - 1.5, y - hs.roof - 14, 3, 14);
        ctx.fillRect(cx - 6, y - hs.roof - 10, 12, 3);
        ctx.beginPath();
        ctx.moveTo(hs.x - 4, y + 18);
        ctx.lineTo(hs.x + hs.w / 2 - 12, y);
        ctx.lineTo(hs.x + hs.w / 2 + 12, y);
        ctx.lineTo(hs.x + hs.w + 4, y + 18);
      } else {
        ctx.moveTo(hs.x - 4, y);
        ctx.lineTo(hs.x + hs.w / 2, y - hs.roof);
        ctx.lineTo(hs.x + hs.w + 4, y);
      }
      ctx.fill();
    }
    if (dawn > 0.6) return;
    for (const hs of this.houses) {
      if (!hs.win) continue;
      const flick = 0.75 + 0.25 * Math.sin(t * 3 + hs.x);
      ctx.fillStyle = `rgba(255,${Math.round(lerp(196, 120, s))},${Math.round(lerp(110, 60, s))},${(0.85 * flick) * (1 - dawn)})`;
      const wx = hs.x + hs.w * 0.3;
      const wy = base - hs.h * 0.6;
      ctx.fillRect(wx, wy, 5, 6);
      ctx.fillStyle = `rgba(255,${Math.round(lerp(196, 120, s))},${Math.round(lerp(110, 60, s))},${(0.85 * flick) * (1 - dawn)})`;
      if (hs.w > 50) ctx.fillRect(hs.x + hs.w * 0.65, wy, 5, 6);
    }
  }

  /** Villagers with torches. More of them, and closer, as suspicion rises. */
  private mob(base: number, t: number, s: number) {
    const { w } = this;
    const n = Math.floor(s * 14);
    if (!n) return;
    const r = rng(99);
    for (let i = 0; i < n; i++) {
      const x = (r() * 0.9 + 0.05) * w;
      const y = base - Math.sin(x * 0.006 + 4.1) * 15 - Math.sin(x * 0.016 + 4.1) * 7.5;
      const scale = 0.7 + s * 0.6 + r() * 0.3;
      const sway = this.reduced ? 0 : Math.sin(t * 2 + i) * 1.5;
      this.villager(x + sway, y, scale, t + i, r() > 0.5);
    }
  }

  private villager(x: number, y: number, k: number, t: number, pitchfork: boolean) {
    const { ctx } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(k, k);
    ctx.fillStyle = "#070506";
    // body
    ctx.beginPath();
    ctx.moveTo(-7, 0);
    ctx.lineTo(-5, -22);
    ctx.quadraticCurveTo(0, -27, 5, -22);
    ctx.lineTo(7, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -29, 5, 0, Math.PI * 2);
    ctx.fill();
    if (pitchfork) {
      ctx.fillRect(-10, -52, 1.6, 40);
      ctx.fillRect(-14, -54, 9.5, 1.6);
      ctx.fillRect(-14, -60, 1.4, 7);
      ctx.fillRect(-10, -60, 1.4, 7);
      ctx.fillRect(-6, -60, 1.4, 7);
    } else {
      // torch
      ctx.fillRect(7, -46, 2, 26);
      const f = 0.8 + 0.2 * Math.sin(t * 13) + 0.1 * Math.sin(t * 29);
      const glow = ctx.createRadialGradient(8, -50, 0, 8, -50, 34 * f);
      glow.addColorStop(0, "rgba(255,190,90,.55)");
      glow.addColorStop(1, "rgba(255,120,40,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(-30, -90, 80, 80);
      ctx.fillStyle = "#ffb347";
      ctx.beginPath();
      ctx.ellipse(8, -51, 3.4 * f, 7 * f, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff0b0";
      ctx.beginPath();
      ctx.ellipse(8, -49.5, 1.6, 3.4 * f, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  private fire(intensity: number) {
    const { ctx, w, h } = this;
    const spawn = Math.round(intensity * 6);
    for (let i = 0; i < spawn; i++) {
      const max = 60 + Math.random() * 80;
      this.embers.push({
        x: Math.random() * w,
        y: h + 10,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(1.5 + Math.random() * 3) * (0.6 + intensity),
        life: max,
        max,
        r: 1 + Math.random() * 2.5,
      });
    }
    if (this.embers.length > 600) this.embers.splice(0, this.embers.length - 600);
    const glow = ctx.createLinearGradient(0, h, 0, h * (1 - 0.55 * intensity));
    glow.addColorStop(0, `rgba(255,110,30,${0.55 * intensity})`);
    glow.addColorStop(1, "rgba(255,80,20,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const e of this.embers) {
      e.x += e.vx + Math.sin(e.y * 0.02) * 0.4;
      e.y += e.vy;
      e.life--;
      const a = Math.max(0, e.life / e.max);
      ctx.fillStyle = `rgba(255,${Math.round(140 + 100 * a)},${Math.round(60 * a)},${a})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * a + 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    this.embers = this.embers.filter((e) => e.life > 0);
  }
}
