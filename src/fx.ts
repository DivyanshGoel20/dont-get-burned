// Rising embers, drawn on a full-screen canvas. Intensity 0 turns it off.

interface Ember { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number }

export class Embers {
  private ctx: CanvasRenderingContext2D;
  private list: Ember[] = [];
  private w = 0;
  private h = 0;
  intensity = 0;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext("2d")!;
    this.resize();
    addEventListener("resize", () => this.resize());
    requestAnimationFrame(this.tick);
  }

  private resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.w = innerWidth;
    this.h = innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private tick = () => {
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);
    if (!this.reduced && this.intensity > 0) {
      const spawn = this.intensity * 3;
      for (let i = 0; i < spawn; i++) {
        if (Math.random() > spawn - i) break;
        const max = 90 + Math.random() * 120;
        this.list.push({
          x: Math.random() * w,
          y: h + 6,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -(0.6 + Math.random() * 1.6) * (0.5 + this.intensity),
          life: max,
          max,
          r: 0.6 + Math.random() * 1.6,
        });
      }
    }
    ctx.globalCompositeOperation = "lighter";
    for (const e of this.list) {
      e.x += e.vx + Math.sin(e.y * 0.015) * 0.3;
      e.y += e.vy;
      e.life--;
      const a = Math.max(0, e.life / e.max);
      ctx.fillStyle = `rgba(255,${Math.round(120 + 110 * a)},${Math.round(50 * a)},${a * 0.85})`;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * (0.4 + a), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    this.list = this.list.filter((e) => e.life > 0 && e.y > -10);
    requestAnimationFrame(this.tick);
  };
}
