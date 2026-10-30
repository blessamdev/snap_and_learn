import { SampleTestCase } from '../types.ts';

// Helper to convert SVG string to clean Base64 data URL
function svgToDataUrl(svgString: string): string {
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(svgString, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(svgString)));
  return `data:image/svg+xml;base64,${base64}`;
}

// 1. K-Map Photo: 4-variable K-Map with handwritten-style student attempt having a grouping error
const kmapSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <defs>
    <filter id="paper" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise"/>
      <feDiffuseLighting in="noise" lighting-color="#fffef8" surfaceScale="2">
        <feDistantLight azimuth="45" elevation="60" />
      </feDiffuseLighting>
      <feBlend mode="multiply" in="SourceGraphic" />
    </filter>
  </defs>
  <!-- Notebook paper background -->
  <rect width="900" height="700" fill="#fcfbf7" />
  <!-- Notebook blue lines -->
  <g stroke="#cbd5e1" stroke-width="1" opacity="0.6">
    <line x1="40" y1="90" x2="860" y2="90" />
    <line x1="40" y1="140" x2="860" y2="140" />
    <line x1="40" y1="190" x2="860" y2="190" />
    <line x1="40" y1="240" x2="860" y2="240" />
    <line x1="40" y1="290" x2="860" y2="290" />
    <line x1="40" y1="340" x2="860" y2="340" />
    <line x1="40" y1="390" x2="860" y2="390" />
    <line x1="40" y1="440" x2="860" y2="440" />
    <line x1="40" y1="490" x2="860" y2="490" />
    <line x1="40" y1="540" x2="860" y2="540" />
    <line x1="40" y1="590" x2="860" y2="590" />
    <line x1="40" y1="640" x2="860" y2="640" />
  </g>
  <!-- Red margin line -->
  <line x1="110" y1="0" x2="110" y2="700" stroke="#fca5a5" stroke-width="2" />

  <!-- Handwritten Title & Problem -->
  <text x="140" y="80" font-family="'JetBrains Mono', monospace" font-size="22" font-weight="bold" fill="#0f172a">CSC 111: Computational Logic - Assignment 2</text>
  <text x="140" y="130" font-family="'JetBrains Mono', monospace" font-size="19" fill="#1e293b">Simplify: F(A,B,C,D) = &#931;m(0, 2, 5, 7, 8, 10, 13, 15)</text>

  <!-- K-Map Grid -->
  <g transform="translate(180, 180)">
    <!-- Diagonal header split -->
    <line x1="0" y1="0" x2="80" y2="80" stroke="#334155" stroke-width="2" />
    <text x="15" y="65" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="bold" fill="#0369a1">AB</text>
    <text x="45" y="30" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="bold" fill="#0369a1">CD</text>

    <!-- Column labels -->
    <text x="125" y="55" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">00</text>
    <text x="205" y="55" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">01</text>
    <text x="285" y="55" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">11</text>
    <text x="365" y="55" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">10</text>

    <!-- Row labels -->
    <text x="40" y="125" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">00</text>
    <text x="40" y="205" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">01</text>
    <text x="40" y="285" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">11</text>
    <text x="40" y="365" font-family="'JetBrains Mono', monospace" font-size="19" font-weight="bold" fill="#334155">10</text>

    <!-- 4x4 Grid Cells -->
    <g stroke="#1e293b" stroke-width="2.5" fill="none">
      <rect x="80" y="80" width="320" height="320" rx="4" />
      <line x1="160" y1="80" x2="160" y2="400" />
      <line x1="240" y1="80" x2="240" y2="400" />
      <line x1="320" y1="80" x2="320" y2="400" />

      <line x1="80" y1="160" x2="400" y2="160" />
      <line x1="80" y1="240" x2="400" y2="240" />
      <line x1="80" y1="320" x2="400" y2="320" />
    </g>

    <!-- Cell Min-term values (1s and 0s) -->
    <!-- Row 00: 0(1), 1(0), 3(0), 2(1) -->
    <text x="115" y="130" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>
    <text x="195" y="130" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>
    <text x="275" y="130" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>
    <text x="355" y="130" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>

    <!-- Row 01: 4(0), 5(1), 7(1), 6(0) -->
    <text x="115" y="210" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>
    <text x="195" y="210" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>
    <text x="275" y="210" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>
    <text x="355" y="210" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>

    <!-- Row 11: 12(0), 13(1), 15(1), 14(0) -->
    <text x="115" y="290" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>
    <text x="195" y="290" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>
    <text x="275" y="290" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>
    <text x="355" y="290" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>

    <!-- Row 10: 8(1), 9(0), 11(0), 10(1) -->
    <text x="115" y="370" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>
    <text x="195" y="370" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>
    <text x="275" y="370" font-family="'JetBrains Mono', monospace" font-size="22" fill="#94a3b8">0</text>
    <text x="355" y="370" font-family="'JetBrains Mono', monospace" font-size="26" font-weight="bold" fill="#0f172a">1</text>

    <!-- Group 1: Quad in middle (5, 7, 13, 15) correctly circled in blue pen -->
    <rect x="175" y="175" width="130" height="130" rx="20" stroke="#0284c7" stroke-width="3" stroke-dasharray="6,4" fill="rgba(2, 132, 199, 0.1)" />
    <text x="180" y="165" font-family="'JetBrains Mono', monospace" font-size="14" fill="#0284c7">Group 1: BD</text>

    <!-- Student Mistake Group: Invalid 3-cell diagonal or missing corner grouping -->
    <!-- Student circled (0, 2) in top row and (8, 10) separately instead of 4 corners, or diagonal loop -->
    <rect x="90" y="90" width="70" height="70" rx="15" stroke="#dc2626" stroke-width="3" fill="none" />
    <rect x="330" y="90" width="70" height="70" rx="15" stroke="#dc2626" stroke-width="3" fill="none" />
    <text x="420" y="125" font-family="'JetBrains Mono', monospace" font-size="16" fill="#dc2626">&#8592; Student wrote: "A&#39;B&#39;C&#39;D&#39; + A&#39;B&#39;CD&#39;"</text>
    <text x="420" y="150" font-family="'JetBrains Mono', monospace" font-size="14" fill="#dc2626">(Did not combine with m8 &amp; m10 corners)</text>
  </g>

  <!-- Student handwritten work below -->
  <text x="140" y="625" font-family="'JetBrains Mono', monospace" font-size="18" fill="#1e293b">My Solution: F = BD + A&#39;B&#39;D&#39; + AB&#39;D&#39;</text>
  <text x="140" y="660" font-family="'JetBrains Mono', monospace" font-size="16" fill="#64748b">(Check if I can simplify corners further)</text>
</svg>`;

// 2. C Compile Error Screenshot: Segmentation Fault & Uninitialized Pointer
const cErrorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#0f172a" rx="12" />
  <!-- Terminal window top bar -->
  <rect width="900" height="42" fill="#1e293b" rx="12 12 0 0" />
  <circle cx="28" cy="21" r="6.5" fill="#ef4444" />
  <circle cx="48" cy="21" r="6.5" fill="#f59e0b" />
  <circle cx="68" cy="21" r="6.5" fill="#10b981" />
  <text x="110" y="27" font-family="'JetBrains Mono', monospace" font-size="14" fill="#94a3b8">student@uon-lab4: ~/cs101/pointers (bash)</text>

  <!-- VS Code / Editor pane -->
  <g transform="translate(30, 70)">
    <rect width="840" height="280" fill="#1e1e2e" rx="8" stroke="#334155" stroke-width="1.5" />
    <text x="20" y="32" font-family="'JetBrains Mono', monospace" font-size="14" fill="#64748b">// File: student_record.c</text>

    <text x="20" y="65" font-family="'JetBrains Mono', monospace" font-size="17" fill="#f43f5e">#include</text>
    <text x="100" y="65" font-family="'JetBrains Mono', monospace" font-size="17" fill="#38bdf8">&lt;stdio.h&gt;</text>

    <text x="20" y="95" font-family="'JetBrains Mono', monospace" font-size="17" fill="#f43f5e">#include</text>
    <text x="100" y="95" font-family="'JetBrains Mono', monospace" font-size="17" fill="#38bdf8">&lt;string.h&gt;</text>

    <text x="20" y="135" font-family="'JetBrains Mono', monospace" font-size="17" fill="#818cf8">int</text>
    <text x="60" y="135" font-family="'JetBrains Mono', monospace" font-size="17" fill="#e2e8f0">main() {</text>

    <text x="50" y="170" font-family="'JetBrains Mono', monospace" font-size="17" fill="#818cf8">char</text>
    <text x="95" y="170" font-family="'JetBrains Mono', monospace" font-size="17" fill="#e2e8f0">*campus_name;</text>
    <text x="260" y="170" font-family="'JetBrains Mono', monospace" font-size="14" fill="#f87171">&#8592; [ERROR: uninitialized pointer!]</text>

    <!-- Bug line highlighted -->
    <rect x="40" y="185" width="460" height="30" fill="rgba(239, 68, 68, 0.2)" rx="4" />
    <text x="50" y="206" font-family="'JetBrains Mono', monospace" font-size="17" fill="#e2e8f0">strcpy(campus_name, <tspan fill="#34d399">"Chiromo Campus"</tspan>);</text>

    <text x="50" y="242" font-family="'JetBrains Mono', monospace" font-size="17" fill="#e2e8f0">printf(<tspan fill="#34d399">"Enrolled at: %s\n"</tspan>, campus_name);</text>

    <text x="50" y="275" font-family="'JetBrains Mono', monospace" font-size="17" fill="#f43f5e">return</text>
    <text x="115" y="275" font-family="'JetBrains Mono', monospace" font-size="17" fill="#fbbf24">0</text>
    <text x="125" y="275" font-family="'JetBrains Mono', monospace" font-size="17" fill="#e2e8f0">;</text>

    <text x="20" y="305" font-family="'JetBrains Mono', monospace" font-size="17" fill="#e2e8f0">}</text>
  </g>

  <!-- Terminal Output / Compiler Crash below -->
  <g transform="translate(30, 390)">
    <rect width="840" height="270" fill="#030712" rx="8" stroke="#ef4444" stroke-width="1.5" />

    <text x="20" y="35" font-family="'JetBrains Mono', monospace" font-size="15" fill="#10b981">$ gcc -Wall student_record.c -o app</text>
    <text x="20" y="65" font-family="'JetBrains Mono', monospace" font-size="14" fill="#fbbf24">student_record.c: In function &#39;main&#39;:</text>
    <text x="20" y="90" font-family="'JetBrains Mono', monospace" font-size="14" fill="#f87171">student_record.c:6:5: warning: &#39;campus_name&#39; is used uninitialized in this function [-Wuninitialized]</text>
    <text x="20" y="115" font-family="'JetBrains Mono', monospace" font-size="14" fill="#94a3b8">    6 |     strcpy(campus_name, "Chiromo Campus");</text>

    <text x="20" y="160" font-family="'JetBrains Mono', monospace" font-size="15" fill="#10b981">$ ./app</text>
    <!-- Big red crash indicator -->
    <rect x="20" y="180" width="360" height="38" fill="#ef4444" rx="4" />
    <text x="32" y="205" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="bold" fill="#ffffff">&#9888; Segmentation fault (core dumped)</text>

    <text x="20" y="250" font-family="'JetBrains Mono', monospace" font-size="14" fill="#94a3b8">student@uon-lab4: ~/cs101/pointers$ _</text>
  </g>
</svg>`;

// 3. Kirchhoff's Law Circuit Diagram
const kirchhoffSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#ffffff" />
  <rect x="20" y="20" width="860" height="660" rx="8" fill="#fafafa" stroke="#e2e8f0" stroke-width="2" />

  <!-- Sheet Header -->
  <text x="60" y="70" font-family="'JetBrains Mono', monospace" font-size="24" font-weight="bold" fill="#0f172a">Physics 102: Two-Mesh Kirchhoff Circuit</text>
  <text x="60" y="105" font-family="'JetBrains Mono', monospace" font-size="16" fill="#475569">Task: Write KVL for Loop 1 and Loop 2, then solve for branch currents I1, I2, I3.</text>

  <!-- Circuit Schematic -->
  <g transform="translate(100, 160)">
    <!-- Main outer wire box -->
    <path d="M 100 80 L 350 80 L 600 80 L 600 360 L 350 360 L 100 360 Z" fill="none" stroke="#1e293b" stroke-width="3" />
    <!-- Center branch wire -->
    <line x1="350" y1="80" x2="350" y2="360" stroke="#1e293b" stroke-width="3" />

    <!-- Junction nodes -->
    <circle cx="350" cy="80" r="6" fill="#0284c7" />
    <circle cx="350" cy="360" r="6" fill="#0284c7" />
    <text x="365" y="75" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="bold" fill="#0284c7">Node A</text>
    <text x="365" y="380" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="bold" fill="#0284c7">Node B</text>

    <!-- Source V1 (Left Branch) 12V Battery -->
    <g transform="translate(100, 200)">
      <line x1="-20" y1="-15" x2="20" y2="-15" stroke="#0f172a" stroke-width="4" />
      <line x1="-10" y1="0" x2="10" y2="0" stroke="#0f172a" stroke-width="2" />
      <line x1="-20" y1="15" x2="20" y2="15" stroke="#0f172a" stroke-width="4" />
      <line x1="-10" y1="30" x2="10" y2="30" stroke="#0f172a" stroke-width="2" />
      <text x="-65" y="12" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="bold" fill="#0f172a">+ 12V -</text>
      <text x="-75" y="32" font-family="'JetBrains Mono', monospace" font-size="14" fill="#64748b">(V1)</text>
    </g>

    <!-- Resistor R1 (Top Left) 4 Ohms -->
    <g transform="translate(190, 80)">
      <rect x="0" y="-12" width="60" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
      <text x="8" y="-18" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">R1 = 4&#937;</text>
    </g>

    <!-- Resistor R2 (Center Branch) 2 Ohms -->
    <g transform="translate(350, 190)">
      <rect x="-12" y="0" width="24" height="60" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
      <text x="20" y="35" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">R2 = 2&#937;</text>
      <text x="20" y="55" font-family="'JetBrains Mono', monospace" font-size="14" fill="#0284c7">&#8595; I3</text>
    </g>

    <!-- Resistor R3 (Top Right) 6 Ohms -->
    <g transform="translate(440, 80)">
      <rect x="0" y="-12" width="60" height="24" fill="#ffffff" stroke="#0f172a" stroke-width="3" />
      <text x="8" y="-18" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">R3 = 6&#937;</text>
    </g>

    <!-- Source V2 (Right Branch) 6V Battery -->
    <g transform="translate(600, 200)">
      <line x1="-20" y1="-15" x2="20" y2="-15" stroke="#0f172a" stroke-width="4" />
      <line x1="-10" y1="0" x2="10" y2="0" stroke="#0f172a" stroke-width="2" />
      <text x="35" y="12" font-family="'JetBrains Mono', monospace" font-size="17" font-weight="bold" fill="#0f172a">+ 6V -</text>
      <text x="35" y="32" font-family="'JetBrains Mono', monospace" font-size="14" fill="#64748b">(V2)</text>
    </g>

    <!-- Mesh Current Loop 1 Arrow -->
    <g transform="translate(225, 230)">
      <path d="M -30 -30 A 40 40 0 1 1 -30 30" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="5,3" marker-end="url(#arrow)" />
      <text x="-15" y="5" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="bold" fill="#0d9488">&#8635; Loop 1 (I1)</text>
    </g>

    <!-- Mesh Current Loop 2 Arrow -->
    <g transform="translate(475, 230)">
      <path d="M -30 -30 A 40 40 0 1 1 -30 30" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="5,3" marker-end="url(#arrow)" />
      <text x="-15" y="5" font-family="'JetBrains Mono', monospace" font-size="18" font-weight="bold" fill="#0d9488">&#8635; Loop 2 (I2)</text>
    </g>
  </g>

  <!-- Student handwritten notes at bottom -->
  <g transform="translate(80, 560)">
    <rect width="740" height="90" fill="#f1f5f9" rx="6" stroke="#cbd5e1" />
    <text x="25" y="30" font-family="'JetBrains Mono', monospace" font-size="16" font-weight="bold" fill="#0f172a">Student's KVL Equations Draft:</text>
    <text x="25" y="56" font-family="'JetBrains Mono', monospace" font-size="15" fill="#334155">Loop 1: 12 - 4*I1 - 2*(I1 - I2) = 0</text>
    <text x="25" y="78" font-family="'JetBrains Mono', monospace" font-size="15" fill="#334155">Loop 2: -6 - 6*I2 - 2*(I2 - I1) = 0</text>
  </g>
</svg>`;

// 4. Blurry Photo: Motion Blurred handwritten notes that should trigger "Please retake a clearer photo"
const blurrySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <defs>
    <!-- Heavy motion blur and gaussian blur filter -->
    <filter id="heavyBlur" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur" />
    </filter>
  </defs>
  <rect width="900" height="700" fill="#e2e8f0" />

  <!-- Out of focus angled desk background -->
  <g filter="url(#heavyBlur)">
    <!-- Notebook with smeared writing -->
    <rect x="80" y="80" width="740" height="540" fill="#fef08a" opacity="0.85" rx="8" />

    <!-- Illegible blurred scribble shapes -->
    <path d="M 120 160 Q 200 130 350 170 T 700 140" stroke="#1e293b" stroke-width="24" fill="none" opacity="0.6" />
    <path d="M 140 230 Q 300 200 480 250 T 750 210" stroke="#1e293b" stroke-width="20" fill="none" opacity="0.5" />
    <path d="M 120 300 Q 250 340 500 290 T 720 320" stroke="#0284c7" stroke-width="22" fill="none" opacity="0.6" />
    <path d="M 150 380 Q 320 360 450 410 T 680 370" stroke="#1e293b" stroke-width="22" fill="none" opacity="0.5" />
    <path d="M 130 450 Q 280 470 520 440 T 740 480" stroke="#dc2626" stroke-width="25" fill="none" opacity="0.5" />
    <circle cx="450" cy="300" r="140" fill="#93c5fd" opacity="0.4" />
  </g>

  <!-- Overlay indicator badge -->
  <rect x="250" y="290" width="400" height="110" rx="12" fill="rgba(15, 23, 42, 0.85)" stroke="#f59e0b" stroke-width="2" />
  <text x="450" y="340" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="20" font-weight="bold" fill="#fbbf24">&#9888; Blurry Camera Capture</text>
  <text x="450" y="375" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="15" fill="#f8fafc">Text illegible due to camera movement</text>
</svg>`;

// 5. Non-Study Photo: Kenyan spiced tea mug with snacks on desk
const nonStudySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <defs>
    <linearGradient id="teaGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b45309" />
      <stop offset="100%" stop-color="#78350f" />
    </linearGradient>
    <linearGradient id="mugGradient" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="50%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
  </defs>

  <!-- Wooden table desk background -->
  <rect width="900" height="700" fill="#d97706" opacity="0.25" />
  <rect width="900" height="700" fill="#78350f" opacity="0.1" />

  <!-- Wooden planks -->
  <line x1="0" y1="180" x2="900" y2="180" stroke="#92400e" stroke-width="2" opacity="0.4" />
  <line x1="0" y1="360" x2="900" y2="360" stroke="#92400e" stroke-width="2" opacity="0.4" />
  <line x1="0" y1="540" x2="900" y2="540" stroke="#92400e" stroke-width="2" opacity="0.4" />

  <!-- Coaster -->
  <ellipse cx="450" cy="460" rx="160" ry="60" fill="#78350f" opacity="0.5" />
  <ellipse cx="450" cy="450" rx="150" ry="50" fill="#fef3c7" stroke="#d97706" stroke-width="3" />

  <!-- Kenyan Tea Ceramic Mug -->
  <!-- Mug handle -->
  <path d="M 540 280 C 640 280, 640 400, 540 400" fill="none" stroke="#ef4444" stroke-width="30" stroke-linecap="round" />
  <path d="M 540 280 C 630 280, 630 400, 540 400" fill="none" stroke="#b91c1c" stroke-width="20" stroke-linecap="round" />

  <!-- Mug body -->
  <path d="M 350 250 L 370 430 C 370 460, 530 460, 530 430 L 550 250 Z" fill="url(#mugGradient)" stroke="#991b1b" stroke-width="2" />
  <!-- Mug rim ellipse -->
  <ellipse cx="450" cy="250" rx="100" ry="32" fill="#b91c1c" />
  <!-- Tea surface -->
  <ellipse cx="450" cy="256" rx="92" ry="26" fill="url(#teaGradient)" />

  <!-- Rising steam curls -->
  <g stroke="#ffffff" stroke-width="3" fill="none" opacity="0.5" stroke-linecap="round">
    <path d="M 420 220 Q 400 170 430 130 T 410 80" />
    <path d="M 450 210 Q 470 160 440 120 T 460 70" />
    <path d="M 480 220 Q 500 170 470 130 T 490 80" />
  </g>

  <!-- Kenyan Mandazi / Snack plate -->
  <g transform="translate(180, 480)">
    <ellipse cx="0" cy="0" rx="80" ry="35" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" />
    <!-- Mandazi triangular pastry -->
    <polygon points="-40,-10 10,-20 -15,10" fill="#d97706" stroke="#b45309" stroke-width="2" rx="4" />
    <polygon points="5,-5 50,-15 30,12" fill="#b45309" stroke="#92400e" stroke-width="2" rx="4" />
  </g>

  <!-- Non-study warning label -->
  <rect x="220" y="590" width="460" height="60" rx="30" fill="rgba(15, 23, 42, 0.9)" />
  <text x="450" y="626" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="16" fill="#f8fafc">☕ Photo of Kenyan Tea (Not Study Material)</text>
</svg>`;

export const SAMPLE_TEST_CASES: SampleTestCase[] = [
  {
    id: 'kmap',
    title: '4-Variable Karnaugh Map',
    subtitle: 'Computational Logic • Corner Wrap Error',
    category: 'Computational Logic',
    recommendedMode: 'check',
    suggestedQuestion: 'Check my K-map simplification for F(A,B,C,D). Did I group the 1s correctly?',
    expectedBehavior: 'Identifies the 4-variable K-map, validates the central quad (BD), detects the mistake with corners (grouped as 2 pairs instead of 4-corner group B\'D\'), explains why corner adjacency works, gives a hint, and shows corrected step.',
    imageDataUrl: svgToDataUrl(kmapSvg),
  },
  {
    id: 'c-error',
    title: 'C Pointer Segmentation Fault',
    subtitle: 'C Programming • Uninitialized Pointer Crash',
    category: 'C Programming',
    recommendedMode: 'explain',
    suggestedQuestion: 'Why is my C code crashing with Segmentation fault when calling strcpy?',
    expectedBehavior: 'Reads the C code and gcc warning. Explains that char *campus_name is an uninitialized wild pointer holding an arbitrary memory address, so strcpy attempts to write into protected memory. Shows corrected code using char campus_name[50] or malloc.',
    imageDataUrl: svgToDataUrl(cErrorSvg),
  },
  {
    id: 'kirchhoff',
    title: 'Two-Loop Kirchhoff Circuit',
    subtitle: 'Physics 102 • KVL Mesh Equations',
    category: 'Introductory Physics',
    recommendedMode: 'quiz',
    suggestedQuestion: 'Quiz me on Kirchhoff\'s laws and how the loop currents interact across R2.',
    expectedBehavior: 'Generates 3 interactive multiple-choice questions testing KVL mesh analysis, sign conventions for voltage sources, and junction current equations across R2. Provides explanations for correct and wrong choices.',
    imageDataUrl: svgToDataUrl(kirchhoffSvg),
  },
  {
    id: 'blurry',
    title: 'Blurry Motion-Blurred Photo',
    subtitle: 'Quality Guardrail • Readable = False',
    category: 'Quality Check',
    recommendedMode: 'explain',
    suggestedQuestion: 'Can you read and explain my formulas?',
    expectedBehavior: 'Returns readable: false. Politely states in 1-2 sentences that the handwriting is motion-blurred and illegible. Refuses to invent formulas or hallucinate content, asking the student to take a steady, sharp photo.',
    imageDataUrl: svgToDataUrl(blurrySvg),
  },
  {
    id: 'non-study',
    title: 'Kenyan Chai (Non-Study Image)',
    subtitle: 'Content Guardrail • Polite Refusal',
    category: 'Guardrail',
    recommendedMode: 'explain',
    suggestedQuestion: 'Help me with this photo',
    expectedBehavior: 'Returns readable: false. Politely identifies that the image shows a cup of tea on a table rather than university study material (Rule 6). Requests the student upload notes, logic diagrams, code, or physics circuits.',
    imageDataUrl: svgToDataUrl(nonStudySvg),
  },
];
