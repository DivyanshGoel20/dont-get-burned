// Agnes's portrait: one inline SVG whose brows, eyes, mouth and props change with her mood.
import type { Mood } from "./shared";

interface Face {
  browL: string;
  browR: string;
  mouth: string;
  /** 0 = eyes fully open, 1 = closed. */
  lid: number;
  /** Lower-lid lift for smiling eyes. */
  smile: number;
  pupil: number;
  flush: number;
  mouthFill: boolean;
}

const FACES: Record<Mood, Face> = {
  curious: {
    browL: "M150 182 Q170 172 190 180",
    browR: "M212 174 Q232 160 252 170",
    mouth: "M180 282 Q202 292 222 280",
    lid: 0.15, smile: 0, pupil: 6, flush: 0.25, mouthFill: false,
  },
  confused: {
    browL: "M150 176 Q170 170 190 184",
    browR: "M212 182 Q232 168 252 178",
    mouth: "M178 286 Q188 278 198 286 Q208 294 222 282",
    lid: 0.1, smile: 0, pupil: 5.5, flush: 0.25, mouthFill: false,
  },
  amazed: {
    browL: "M150 170 Q170 156 190 168",
    browR: "M212 168 Q232 156 252 170",
    mouth: "M188 278 Q201 268 214 278 Q218 300 201 302 Q184 300 188 278 Z",
    lid: 0, smile: 0, pupil: 7, flush: 0.35, mouthFill: true,
  },
  delighted: {
    browL: "M150 176 Q170 166 190 174",
    browR: "M212 174 Q232 166 252 176",
    mouth: "M174 276 Q201 312 228 276 Q201 290 174 276 Z",
    lid: 0.2, smile: 0.55, pupil: 6, flush: 0.5, mouthFill: true,
  },
  suspicious: {
    browL: "M150 182 Q172 184 192 192",
    browR: "M210 190 Q232 182 252 180",
    mouth: "M184 286 L220 282",
    lid: 0.5, smile: 0.2, pupil: 5, flush: 0.2, mouthFill: false,
  },
  afraid: {
    browL: "M150 182 Q172 168 192 170",
    browR: "M210 170 Q232 168 252 182",
    mouth: "M184 294 Q201 270 218 294 Q201 300 184 294 Z",
    lid: 0, smile: 0, pupil: 4, flush: 0.05, mouthFill: true,
  },
  furious: {
    browL: "M148 174 Q172 182 194 196",
    browR: "M208 196 Q232 182 254 174",
    mouth: "M176 284 Q201 270 226 284 Q226 304 201 306 Q176 304 176 284 Z",
    lid: 0.35, smile: 0, pupil: 5, flush: 0.75, mouthFill: true,
  },
};

const SVG = /* svg */ `
<svg viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Agnes, a medieval turnip farmer">
  <defs>
    <radialGradient id="ag-light" cx="70%" cy="30%" r="80%">
      <stop offset="0" stop-color="#ffd9a0" stop-opacity=".55"/>
      <stop offset=".6" stop-color="#ffb070" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ag-skin" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#f1c39a"/>
      <stop offset="1" stop-color="#cf9470"/>
    </linearGradient>
    <linearGradient id="ag-cloth" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#f5eedf"/>
      <stop offset="1" stop-color="#d9cdb4"/>
    </linearGradient>
    <linearGradient id="ag-dress" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#6d4a32"/>
      <stop offset="1" stop-color="#3f2a1d"/>
    </linearGradient>
    <clipPath id="ag-eyeL"><ellipse cx="172" cy="210" rx="15" ry="10"/></clipPath>
    <clipPath id="ag-eyeR"><ellipse cx="230" cy="210" rx="15" ry="10"/></clipPath>
  </defs>

  <g class="ag-body">
    <!-- dress and shawl -->
    <path d="M40 480 C52 404 120 362 200 356 C280 362 348 404 360 480 Z" fill="url(#ag-dress)"/>
    <path d="M118 392 C150 370 176 364 200 364 C224 364 250 370 282 392 L262 480 L138 480 Z" fill="#8a5b3c" opacity=".55"/>
    <path d="M150 380 Q200 420 250 380" stroke="#2a1b12" stroke-width="2" fill="none" opacity=".4"/>
    <!-- neck -->
    <path d="M172 300 L228 300 L232 368 Q200 380 168 368 Z" fill="#c98d68"/>
    <!-- wimple behind the face -->
    <path d="M86 214 C82 120 140 70 202 70 C266 70 320 120 316 214 C314 290 290 350 252 376 Q200 396 148 376 C110 350 88 290 86 214 Z" fill="url(#ag-cloth)"/>
    <path d="M110 260 Q120 330 160 366 M292 260 Q282 330 242 366" stroke="#bfb092" stroke-width="2" fill="none"/>
  </g>

  <g class="ag-head">
    <!-- face -->
    <ellipse cx="201" cy="222" rx="82" ry="98" fill="url(#ag-skin)"/>
    <!-- chin band (barbette) -->
    <path d="M122 250 Q132 340 201 344 Q270 340 280 250 Q276 330 201 362 Q126 330 122 250 Z" fill="url(#ag-cloth)"/>
    <!-- hair and forehead band -->
    <path d="M128 168 Q140 128 201 124 Q262 128 274 168 Q250 146 201 146 Q152 146 128 168 Z" fill="#5a3b26"/>
    <path d="M118 150 Q140 104 201 100 Q262 104 284 150 Q262 132 201 130 Q140 132 118 150 Z" fill="#fbf6ea"/>
    <path d="M124 146 Q201 116 278 146" stroke="#cdbf9f" stroke-width="2" fill="none"/>

    <!-- cheeks -->
    <ellipse class="ag-flush" cx="152" cy="252" rx="20" ry="12" fill="#e0614a"/>
    <ellipse class="ag-flush" cx="250" cy="252" rx="20" ry="12" fill="#e0614a"/>
    <g fill="#9a5f40" opacity=".55">
      <circle cx="160" cy="240" r="1.4"/><circle cx="168" cy="246" r="1.2"/><circle cx="152" cy="244" r="1.1"/>
      <circle cx="240" cy="240" r="1.4"/><circle cx="248" cy="246" r="1.2"/><circle cx="234" cy="246" r="1.1"/>
    </g>

    <!-- eyes -->
    <g clip-path="url(#ag-eyeL)">
      <ellipse cx="172" cy="210" rx="15" ry="10" fill="#fbf4e8"/>
      <g class="ag-pupil"><circle cx="174" cy="210" r="6" fill="#3b2618"/><circle cx="176" cy="208" r="1.8" fill="#fff"/></g>
      <rect class="ag-lid" x="150" y="196" width="44" height="28" fill="#dda57f"/>
      <rect class="ag-lower" x="150" y="196" width="44" height="28" fill="#dda57f"/>
    </g>
    <g clip-path="url(#ag-eyeR)">
      <ellipse cx="230" cy="210" rx="15" ry="10" fill="#fbf4e8"/>
      <g class="ag-pupil"><circle cx="232" cy="210" r="6" fill="#3b2618"/><circle cx="234" cy="208" r="1.8" fill="#fff"/></g>
      <rect class="ag-lid" x="208" y="196" width="44" height="28" fill="#dda57f"/>
      <rect class="ag-lower" x="208" y="196" width="44" height="28" fill="#dda57f"/>
    </g>
    <path d="M156 210 Q172 198 188 208 M214 208 Q230 198 246 210" stroke="#5a3624" stroke-width="2.2" fill="none" stroke-linecap="round"/>

    <!-- brows -->
    <path class="ag-browL" stroke="#4a2f1e" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path class="ag-browR" stroke="#4a2f1e" stroke-width="5" stroke-linecap="round" fill="none"/>

    <!-- nose -->
    <path d="M203 214 Q198 240 190 252 Q200 262 212 254" stroke="#a8694a" stroke-width="2.6" fill="none" stroke-linecap="round"/>

    <!-- mouth -->
    <path class="ag-mouth" stroke="#7a3428" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>

    <!-- wrinkles of worry -->
    <path class="ag-worry" d="M186 162 Q201 156 216 162 M190 154 Q201 150 212 154" stroke="#b47a58" stroke-width="1.6" fill="none" opacity="0"/>
  </g>

  <!-- torch (only when furious) -->
  <g class="ag-torch">
    <rect x="318" y="250" width="12" height="220" rx="4" fill="#5b3a22" transform="rotate(8 324 360)"/>
    <path d="M322 250 Q300 210 326 168 Q330 196 344 186 Q352 222 334 252 Z" fill="#ff9a3c"/>
    <path d="M326 248 Q314 222 328 196 Q334 214 340 210 Q342 232 332 250 Z" fill="#ffe08a"/>
  </g>

  <rect width="400" height="480" fill="url(#ag-light)" pointer-events="none"/>
</svg>`;

export class Agnes {
  private root: HTMLElement;
  private q = <T extends Element>(sel: string) => this.root.querySelectorAll<T>(sel);
  mood: Mood = "curious";

  constructor(root: HTMLElement) {
    this.root = root;
    root.innerHTML = SVG;
    this.setMood("curious", true);
    this.blinkLoop();
  }

  setMood(mood: Mood, instant = false) {
    this.mood = mood;
    const f = FACES[mood];
    this.root.dataset.mood = mood;
    this.root.classList.toggle("instant", instant);
    this.q<SVGPathElement>(".ag-browL")[0].setAttribute("d", f.browL);
    this.q<SVGPathElement>(".ag-browR")[0].setAttribute("d", f.browR);
    const mouth = this.q<SVGPathElement>(".ag-mouth")[0];
    mouth.setAttribute("d", f.mouth);
    mouth.setAttribute("fill", f.mouthFill ? "#5a1f19" : "none");
    this.root.style.setProperty("--lid", String(f.lid));
    this.root.style.setProperty("--smile", String(f.smile));
    this.root.style.setProperty("--flush", String(f.flush));
    this.q<SVGGElement>(".ag-pupil").forEach((p) => p.setAttribute("transform-origin", "center"));
    this.root.style.setProperty("--pupil", String(f.pupil / 6));
    // a little jolt on every change
    this.root.classList.remove("react");
    void this.root.offsetWidth;
    this.root.classList.add("react");
  }

  /** Small nod while she "thinks". */
  thinking(on: boolean) {
    this.root.classList.toggle("thinking", on);
  }

  private blinkLoop() {
    const blink = () => {
      this.root.classList.add("blink");
      setTimeout(() => this.root.classList.remove("blink"), 140);
      setTimeout(blink, 2400 + Math.random() * 3600);
    };
    setTimeout(blink, 1800);
  }
}
