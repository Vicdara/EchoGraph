import { SampleGraph } from "../types";

// Helper to convert inline SVG string to data URL
function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

export const SAMPLE_GRAPHS: SampleGraph[] = [
  {
    id: "enzyme-kinetics",
    title: "Enzyme Reaction Rate vs Temperature",
    category: "Biology",
    type: "Line Graph",
    description: "Bell-shaped curve showing optimal human enzyme activity peaking at 37°C, followed by rapid denaturing drop above 45°C.",
    precomputedValues: [15, 25, 45, 75, 100, 92, 50, 10, 2],
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#ffffff; font-family:sans-serif;">
        <rect width="600" height="400" fill="#ffffff"/>
        <!-- Title -->
        <text x="300" y="36" text-anchor="middle" font-size="18" font-weight="bold" fill="#1a2b4a">Effect of Temperature on Enzyme Activity (Amylase)</text>
        
        <!-- Grid & Axes -->
        <line x1="80" y1="320" x2="540" y2="320" stroke="#333333" stroke-width="2"/>
        <line x1="80" y1="320" x2="80" y2="60" stroke="#333333" stroke-width="2"/>
        
        <!-- Y-Axis Ticks & Labels -->
        <text x="70" y="325" text-anchor="end" font-size="12" fill="#555555">0</text>
        <text x="70" y="260" text-anchor="end" font-size="12" fill="#555555">25</text>
        <text x="70" y="195" text-anchor="end" font-size="12" fill="#555555">50</text>
        <text x="70" y="130" text-anchor="end" font-size="12" fill="#555555">75</text>
        <text x="70" y="65" text-anchor="end" font-size="12" fill="#555555">100</text>
        <text x="25" y="190" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a2b4a" transform="rotate(-90 25 190)">Reaction Rate (% of Maximum)</text>
        
        <!-- X-Axis Ticks & Labels -->
        <text x="80" y="340" text-anchor="middle" font-size="12" fill="#555555">0°C</text>
        <text x="172" y="340" text-anchor="middle" font-size="12" fill="#555555">20°C</text>
        <text x="264" y="340" text-anchor="middle" font-size="12" fill="#555555">37°C</text>
        <text x="356" y="340" text-anchor="middle" font-size="12" fill="#555555">50°C</text>
        <text x="448" y="340" text-anchor="middle" font-size="12" fill="#555555">70°C</text>
        <text x="540" y="340" text-anchor="middle" font-size="12" fill="#555555">90°C</text>
        <text x="310" y="375" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a2b4a">Temperature (°C)</text>
        
        <!-- Optimal Zone Marker -->
        <rect x="235" y="60" width="60" height="260" fill="#0d9488" fill-opacity="0.12"/>
        <line x1="265" y1="60" x2="265" y2="320" stroke="#0d9488" stroke-dasharray="4" stroke-width="1.5"/>
        <text x="265" y="55" text-anchor="middle" font-size="11" font-weight="bold" fill="#0d9488">Optimum ~37°C</text>
        
        <!-- Curve Path -->
        <path d="M 80 300 C 140 280, 200 210, 265 75 C 310 85, 340 180, 375 295 C 410 315, 480 320, 540 320" fill="none" stroke="#0d9488" stroke-width="4"/>
        
        <!-- Key Data Points -->
        <circle cx="80" cy="300" r="5" fill="#0d9488"/>
        <circle cx="172" cy="245" r="5" fill="#0d9488"/>
        <circle cx="265" cy="75" r="6" fill="#e11d48"/>
        <circle cx="356" cy="235" r="5" fill="#0d9488"/>
        <circle cx="448" cy="315" r="5" fill="#0d9488"/>
        
        <!-- Label for denaturation -->
        <text x="380" y="220" font-size="11" fill="#e11d48" font-weight="bold">Rapid Denaturation &gt;45°C</text>
      </svg>
    `),
  },
  {
    id: "atp-yield",
    title: "ATP Yield in Cellular Respiration",
    category: "Biology",
    type: "Bar Chart",
    description: "Bar chart comparing ATP output across Glycolysis (2), Krebs Cycle (2), and Oxidative Phosphorylation (28-32).",
    precomputedValues: [6, 6, 94],
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#ffffff; font-family:sans-serif;">
        <rect width="600" height="400" fill="#ffffff"/>
        <!-- Title -->
        <text x="300" y="36" text-anchor="middle" font-size="18" font-weight="bold" fill="#1a2b4a">Net ATP Produced per Molecule of Glucose</text>
        
        <!-- Axes -->
        <line x1="80" y1="320" x2="540" y2="320" stroke="#333333" stroke-width="2"/>
        <line x1="80" y1="320" x2="80" y2="60" stroke="#333333" stroke-width="2"/>
        
        <!-- Y-Axis -->
        <text x="70" y="325" text-anchor="end" font-size="12" fill="#555555">0</text>
        <text x="70" y="245" text-anchor="end" font-size="12" fill="#555555">10</text>
        <text x="70" y="165" text-anchor="end" font-size="12" fill="#555555">20</text>
        <text x="70" y="85" text-anchor="end" font-size="12" fill="#555555">30</text>
        <text x="25" y="190" text-anchor="middle" font-size="13" font-weight="bold" fill="#1a2b4a" transform="rotate(-90 25 190)">ATP Molecules</text>
        
        <!-- Bars -->
        <!-- Glycolysis: 2 ATP (height: 16px) -->
        <rect x="120" y="304" width="90" height="16" fill="#3b82f6" rx="4"/>
        <text x="165" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="#1e40af">2 ATP</text>
        <text x="165" y="340" text-anchor="middle" font-size="12" font-weight="bold" fill="#333333">Glycolysis</text>
        <text x="165" y="358" text-anchor="middle" font-size="10" fill="#666666">(Cytosol)</text>
        
        <!-- Krebs Cycle / Citric Acid: 2 ATP (height: 16px) -->
        <rect x="260" y="304" width="90" height="16" fill="#10b981" rx="4"/>
        <text x="305" y="295" text-anchor="middle" font-size="13" font-weight="bold" fill="#065f46">2 ATP</text>
        <text x="305" y="340" text-anchor="middle" font-size="12" font-weight="bold" fill="#333333">Krebs Cycle</text>
        <text x="305" y="358" text-anchor="middle" font-size="10" fill="#666666">(Mito Matrix)</text>
        
        <!-- Oxidative Phosphorylation: 28-32 ATP (height: 240px, y: 80) -->
        <rect x="400" y="80" width="90" height="240" fill="#0d9488" rx="4"/>
        <text x="445" y="70" text-anchor="middle" font-size="13" font-weight="bold" fill="#0f766e">28-32 ATP</text>
        <text x="445" y="340" text-anchor="middle" font-size="12" font-weight="bold" fill="#333333">Oxidative Phos.</text>
        <text x="445" y="358" text-anchor="middle" font-size="10" fill="#666666">(Inner Membrane)</text>
        
        <!-- Highlight Callout -->
        <text x="300" y="388" text-anchor="middle" font-size="11" fill="#555555">Total Max Yield: ~32-36 ATP per Glucose molecule</text>
      </svg>
    `),
  },
  {
    id: "plant-cell-diagram",
    title: "Plant Cell Organelle Diagram",
    category: "Biology",
    type: "Labeled Diagram",
    description: "Cross-section diagram labeling Cell Wall, Chloroplast, Large Central Vacuole, Mitochondria, and Nucleus.",
    precomputedValues: [30, 60, 90, 45, 75],
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#ffffff; font-family:sans-serif;">
        <rect width="600" height="400" fill="#ffffff"/>
        <!-- Title -->
        <text x="300" y="32" text-anchor="middle" font-size="18" font-weight="bold" fill="#1a2b4a">Plant Cell Structure &amp; Key Organelles</text>
        
        <!-- Outer Cell Wall (green polygon) -->
        <polygon points="120,70 480,70 530,220 480,350 120,350 70,220" fill="#dcfce7" stroke="#15803d" stroke-width="8"/>
        <!-- Inner Cell Membrane -->
        <polygon points="126,76 474,76 522,220 474,344 126,344 78,220" fill="#f0fdf4" stroke="#86efac" stroke-width="3"/>
        
        <!-- Large Central Vacuole (blue central fluid area) -->
        <ellipse cx="270" cy="220" rx="110" ry="75" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
        <text x="270" y="225" text-anchor="middle" font-size="12" font-weight="bold" fill="#0369a1">Central Vacuole</text>
        <text x="270" y="240" text-anchor="middle" font-size="10" fill="#0284c7">(Turgor Pressure / H2O)</text>
        
        <!-- Nucleus (purple circle with nucleolus) -->
        <circle cx="430" cy="160" r="45" fill="#f3e8ff" stroke="#7e22ce" stroke-width="2"/>
        <circle cx="430" cy="160" r="16" fill="#a855f7"/>
        <text x="430" y="220" text-anchor="middle" font-size="11" font-weight="bold" fill="#6b21a8">Nucleus (DNA)</text>
        
        <!-- Chloroplasts (green ovals with thylakoids) -->
        <g transform="translate(130, 110)">
          <ellipse cx="25" cy="15" rx="25" ry="15" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
          <line x1="10" y1="15" x2="40" y2="15" stroke="#ffffff" stroke-width="2"/>
          <text x="25" y="42" text-anchor="middle" font-size="10" font-weight="bold" fill="#15803d">Chloroplast</text>
        </g>
        
        <g transform="translate(140, 270)">
          <ellipse cx="25" cy="15" rx="25" ry="15" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
          <line x1="10" y1="15" x2="40" y2="15" stroke="#ffffff" stroke-width="2"/>
        </g>
        
        <!-- Mitochondria (orange oval with cristae) -->
        <g transform="translate(420, 270)">
          <ellipse cx="25" cy="15" rx="25" ry="15" fill="#fed7aa" stroke="#c2410c" stroke-width="1.5"/>
          <path d="M 10 15 Q 18 5 25 15 T 40 15" fill="none" stroke="#ea580c" stroke-width="2"/>
          <text x="25" y="42" text-anchor="middle" font-size="10" font-weight="bold" fill="#9a3412">Mitochondria</text>
        </g>
        
        <!-- Labels / Pointers -->
        <line x1="70" y1="220" x2="30" y2="220" stroke="#15803d" stroke-width="1.5"/>
        <text x="25" y="215" text-anchor="end" font-size="11" font-weight="bold" fill="#15803d">Rigid Cell Wall</text>
        <text x="25" y="230" text-anchor="end" font-size="9" fill="#555555">(Cellulose)</text>
      </svg>
    `),
  },
  {
    id: "predator-prey",
    title: "Predator-Prey Population Cycles (Textbook Photo)",
    category: "Biology",
    type: "Line Graph",
    description: "Oscillating periodic cycles of Snowshoe Hare (prey) and Canadian Lynx (predator) over a 90-year span.",
    precomputedValues: [40, 95, 20, 90, 25, 85, 30, 90],
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#fcfbf9; font-family:serif;">
        <rect width="600" height="400" fill="#faf7ee"/>
        <!-- Distressed / Textbook Paper border effect -->
        <rect x="10" y="10" width="580" height="380" fill="#ffffff" stroke="#d5ceb9" stroke-width="2"/>
        
        <!-- Header text from textbook -->
        <text x="30" y="38" font-size="11" fill="#777777" font-family="sans-serif">Figure 54.14 • Community Ecology Case Study</text>
        <text x="300" y="65" text-anchor="middle" font-size="16" font-weight="bold" fill="#1a2b4a" font-family="sans-serif">Population Cycles of the Snowshoe Hare and the Canadian Lynx</text>
        
        <!-- Axes -->
        <line x1="70" y1="310" x2="550" y2="310" stroke="#222222" stroke-width="1.5"/>
        <line x1="70" y1="310" x2="70" y2="90" stroke="#222222" stroke-width="1.5"/>
        
        <!-- Labels -->
        <text x="60" y="315" text-anchor="end" font-size="11" fill="#444444" font-family="sans-serif">0</text>
        <text x="60" y="240" text-anchor="end" font-size="11" fill="#444444" font-family="sans-serif">80</text>
        <text x="60" y="165" text-anchor="end" font-size="11" fill="#444444" font-family="sans-serif">160</text>
        <text x="25" y="200" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a2b4a" transform="rotate(-90 25 200)" font-family="sans-serif">Number of Animals (thousands)</text>
        
        <text x="120" y="330" text-anchor="middle" font-size="11" fill="#444444" font-family="sans-serif">1850</text>
        <text x="220" y="330" text-anchor="middle" font-size="11" fill="#444444" font-family="sans-serif">1875</text>
        <text x="320" y="330" text-anchor="middle" font-size="11" fill="#444444" font-family="sans-serif">1900</text>
        <text x="420" y="330" text-anchor="middle" font-size="11" fill="#444444" font-family="sans-serif">1925</text>
        <text x="520" y="330" text-anchor="middle" font-size="11" fill="#444444" font-family="sans-serif">1950</text>
        
        <!-- Hare Curve (Blue solid, peaks first) -->
        <path d="M 80 270 Q 110 110 140 280 T 200 120 T 260 275 T 320 100 T 380 285 T 440 115 T 500 270 T 540 130" fill="none" stroke="#2563eb" stroke-width="2.5"/>
        
        <!-- Lynx Curve (Red dashed, lags hare peak by ~1-2 years) -->
        <path d="M 80 290 Q 120 180 155 295 T 215 190 T 275 290 T 335 175 T 395 295 T 455 180 T 515 290 T 540 210" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,3"/>
        
        <!-- Legend -->
        <rect x="360" y="85" width="180" height="48" fill="#ffffff" stroke="#cccccc" rx="3"/>
        <line x1="370" y1="100" x2="400" y2="100" stroke="#2563eb" stroke-width="2.5"/>
        <text x="410" y="104" font-size="11" fill="#2563eb" font-weight="bold" font-family="sans-serif">Snowshoe Hare (Prey)</text>
        <line x1="370" y1="120" x2="400" y2="120" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,3"/>
        <text x="410" y="124" font-size="11" fill="#dc2626" font-weight="bold" font-family="sans-serif">Canadian Lynx (Predator)</text>
        
        <!-- Explanatory note -->
        <text x="300" y="370" text-anchor="middle" font-size="11" font-style="italic" fill="#555555">Observation: Lynx predator peaks consistently lag behind hare prey peaks by approximately 1 to 2 years.</text>
      </svg>
    `),
  },
  {
    id: "energy-pyramid",
    title: "Trophic Level Energy Distribution",
    category: "Biology",
    type: "Pie / Pyramid Chart",
    description: "10% rule energy distribution across Primary Producers (10,000 J), Primary Consumers (1,000 J), Secondary (100 J), and Apex (10 J).",
    precomputedValues: [90, 9, 0.9, 0.1],
    imageUrl: svgToDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400" style="background:#ffffff; font-family:sans-serif;">
        <rect width="600" height="400" fill="#ffffff"/>
        <!-- Title -->
        <text x="300" y="36" text-anchor="middle" font-size="18" font-weight="bold" fill="#1a2b4a">Ecological Energy Transfer (The 10% Rule)</text>
        
        <!-- Pyramid Tiers -->
        <!-- Tier 1: Apex Predator (Top) -->
        <polygon points="260,90 340,90 370,140 230,140" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"/>
        <text x="300" y="115" text-anchor="middle" font-size="11" font-weight="bold" fill="#ffffff">Apex (10 J / 0.1%)</text>
        
        <!-- Tier 2: Secondary Consumers -->
        <polygon points="230,142 370,142 410,200 190,200" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
        <text x="300" y="175" text-anchor="middle" font-size="12" font-weight="bold" fill="#ffffff">Secondary Consumers (100 J / 1%)</text>
        
        <!-- Tier 3: Primary Consumers (Herbivores) -->
        <polygon points="190,202 410,202 450,265 150,265" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1.5"/>
        <text x="300" y="238" text-anchor="middle" font-size="13" font-weight="bold" fill="#ffffff">Primary Consumers / Herbivores (1,000 J / 10%)</text>
        
        <!-- Tier 4: Primary Producers (Base) -->
        <polygon points="150,267 450,267 500,340 100,340" fill="#10b981" stroke="#047857" stroke-width="1.5"/>
        <text x="300" y="310" text-anchor="middle" font-size="14" font-weight="bold" fill="#ffffff">Primary Producers / Plants (10,000 J / 100%)</text>
        
        <!-- Heat Loss Indicator on the side -->
        <path d="M 470 300 Q 530 250 510 180 T 540 100" fill="none" stroke="#f97316" stroke-width="3" stroke-dasharray="4,4"/>
        <text x="545" y="200" font-size="12" font-weight="bold" fill="#c2410c">~90% Lost</text>
        <text x="545" y="216" font-size="11" fill="#c2410c">as Metabolic Heat</text>
      </svg>
    `),
  }
];
