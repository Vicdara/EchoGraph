# EchoGraph — One-Pager

> **"Turns chart and graph images into spoken descriptions for blind and low-vision students."**

---

## 1. Who We Built This For

**Meet Amara:** A 16-year-old high school student who is legally blind and taking AP Biology. 

Her textbook and lab worksheets are filled with enzyme kinetics curves, metabolic bar charts, cellular respiration ATP tables, and labeled organelle diagrams. In almost every digital textbook or school PDF, the image "alt text" is either completely missing or says something useless like `figure_1.png`. 

Her screen reader is left silent. Amara isn't held back by biology — she is locked out of the **~30% of STEM curriculum** that is delivered as visual images rather than text. 

EchoGraph gives Amara immediate autonomy: she takes a photo of a textbook page, drops a screenshot into her browser, or pastes from clipboard (`Ctrl+V`), and gets a structured, spoken explanation of what the chart proves, what its axes measure, and what its numbers mean — read aloud instantly with high-fidelity pitch sonification and braille-ready text export.

---

## 2. The Core Barrier EchoGraph Removes

Existing solutions fail blind students in two ways:
1. **Generic Image Captioning is Vague:** Standard image-to-text models say *"A graph with blue and red lines"* without stating what the axes measure, what the units are, or what biological phenomenon is depicted.
2. **Hallucination Risk in STEM:** In science, an AI hallucinating a number or inverting a trend isn't just a minor glitch — it causes a student to learn incorrect science.

---

## 3. How EchoGraph Works (The 2-Pass Architecture)

```
[ Image Upload / Paste / Photo ]
                │
                ▼
   [ Pass 1: Visual Structural Breakdown ]
   Model: hy3-free / mimo-v2.5-free on OpenCode Zen
   Outputs: Summary, Structure, The Data, Why It Matters, Sonification Curve
                │
                ▼
   [ Pass 2: AI Self-Verification / Audit ]
   Checks draft description against original image coordinates & axes
   Outputs: "✓ Verified" or "⚠ Uncertain about: [specific thing]"
                │
                ▼
   [ Instant Accessible Multi-Modal Output ]
   1. Spoken Audio (Browser-native SpeechSynthesis, auto-plays, zero-cost)
   2. Pitch Sonification (Web Audio API tone sequence mapping data curve)
   3. Screen Reader Live Announcements (ARIA live regions)
   4. High-Contrast WCAG AAA View (Pure Black / Pure White / Zero Gray)
   5. Copy as Text (Ready for Braille displays & notes)
```

---

## 4. Key Differentiators

- **Visible 2-Pass Confidence Check:** The AI audits its own visual perception before finalizing. If an axis or fine number is ambiguous, it alerts the student (`⚠ Uncertain about...`) instead of confidently misleading them.
- **Data Sonification:** Students can hear the physical curve of a line or bar graph as ascending and descending pitch frequencies using the Web Audio API.
- **Built for Real Assistive Tech:** Styled in Atkinson Hyperlegible (developed by the Braille Institute for low vision), 100% keyboard navigable, aria-live region announcements, and a genuine high-contrast toggle.
- **OpenCode Free Models & Zero Setup:** Bundled with OpenCode Zen free models (`hy3-free`, `mimo-v2.5-free`, `muse-spark-1.2`, `nemotron-3-ultra-free`, `deepseek-v4-flash-free`) and 5 representative AP Biology test graphs.

---

## 5. Technical Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **AI Vision Engine:** OpenCode AI Zen Gateway (`hy3-free`, `mimo-v2.5-free`, `muse-spark-1.2`, `nemotron-3-ultra-free`, `deepseek-v4-flash-free`)
- **Audio & Accessibility:** Web Speech API (`SpeechSynthesis`), Web Audio API (`AudioContext` oscillators), Atkinson Hyperlegible Typography
- **Zero Backend Required:** Static, edge-deployable client application
