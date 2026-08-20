# EchoGraph 📊🎙️

> **"Turns chart and graph images into spoken descriptions for blind and low-vision students."**

EchoGraph is an accessible educational web application built to convert photos, screenshots, and textbook diagrams into rich, structured spoken descriptions for blind and low-vision students — featuring an autonomous **AI self-verification check** before the description is presented to the student.

---

## 🎯 Target Persona: Amara's Story

**Amara (16)** is a legally blind high school student taking AP Biology. Her textbooks and exams are full of bar charts, enzyme kinetics curves, and organelle diagrams. In digital PDFs, the image alt-text is almost always missing or useless (`image_1.png`). Her screen reader has nothing to read. 

Amara is not locked out of biology — she is locked out of the **~30% of course materials delivered as images instead of text**. 

EchoGraph allows Amara to snap a photo, drag a screenshot, or paste directly from her clipboard (`Ctrl+V`), and immediately receive:
1. **Summary:** Core takeaway in one clear sentence.
2. **Structure:** Axes, units, scales, labels, and diagram layouts.
3. **The Data:** Exact data points, peaks, inflection points, and trends.
4. **Why It Matters:** The underlying scientific or educational concept.
5. **Pitch Sonification:** Auditory waveform translating graph shapes into ascending/descending tones.

---

## ✨ Key Features

- 🔬 **2-Pass AI Self-Verification:** The vision model checks its own draft against the original image to catch hallucinations or misread scales before finalizing. Displays `✓ Verified` or a highlighted `⚠ Uncertain about: [specific thing]` warning.
- 🗣️ **Browser-Native Text-to-Speech (TTS):** Uses the browser's `SpeechSynthesis` API — completely free, reliable offline, and free from API rate limits.
- 🎵 **Data Curve Sonification:** Web Audio API frequency oscillator mapping values (220Hz - 880Hz) so students can *hear* graph trends.
- 👁️ **Atkinson Hyperlegible Font & WCAG AAA High Contrast:** Designed by the Braille Institute for low vision, paired with a true pure-black/pure-white high contrast mode with zero low-contrast grays.
- ⌨️ **100% Keyboard & Screen Reader Accessible:** Global paste handler, focus rings, ARIA live regions, and semantic landmark navigation.
- 📋 **Braille-Ready Text Export:** One-click copy formatted for notes and refreshable braille displays.
- 🧪 **1-Click Test Graphs:** Built-in suite of AP Biology test figures (Enzyme Kinetics Line Graph, Cellular Respiration ATP Bar Chart, Plant Cell Diagram, Textbook Predator-Prey Graph, Trophic Level Energy Pyramid).
- ⚙️ **OpenCode Free Models & Custom Key Support:** Powered by OpenCode Zen with full support for free models (`hy3-free`, `mimo-v2.5-free`, `muse-spark-1.2`, `nemotron-3-ultra-free`, `deepseek-v4-flash-free`) plus custom API key and endpoint configuration.

---

## 🛠️ Tech Stack

- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (Atkinson Hyperlegible, custom WCAG palette)
- **AI Vision Engine:** [OpenCode AI Zen Gateway](https://opencode.ai/zen/v1) (OpenAI-compatible)
- **Supported Free Models:**
  - `hy3-free` (Default Recommended)
  - `mimo-v2.5-free`
  - `muse-spark-1.2-contributor-free` / `muse-spark-1.2`
  - `nemotron-3-ultra-free` / `nemotron-3.5-lightning-free`
  - `deepseek-v4-flash-free`
  - `big-pickle`
- **Audio:** Web Speech API (`SpeechSynthesis`) & Web Audio API (`AudioContext`)
- **Icons:** Lucide React

---

## 🤖 Mandatory AI Tools Disclosure

In accordance with hackathon submission guidelines, the following AI tools and models were used in this project:

1. **OpenCode AI Zen (`hy3-free` / `mimo-v2.5-free` / `nemotron-3-ultra-free` / `muse-spark-1.2`):**
   - **Pass 1:** Visual feature extraction, diagram decomposition, and structured scientific accessibility description generation.
   - **Pass 2:** Automated self-verification audit against the source image to detect misidentified axes, hallucinations, or scale uncertainties.
2. **Google Antigravity (Advanced Agentic Assistant):**
   - Used for application architecture design, accessible component scaffolding, TypeScript type definitions, Web Audio sonification algorithms, and WCAG AAA compliance styling.

---

## 🚀 Quickstart & Setup

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/echograph.git
cd echograph

# Install dependencies
npm install

# Run locally
npm run dev
```
Open `http://localhost:3000` in your browser.

### Custom Keys & Configuration
You can customize your API key, base URL, and active model either in the `.env` file or directly inside the app using the **gear icon (Settings)** in the footer.

```env
VITE_OPENCODE_API_KEY=sk-...
VITE_OPENCODE_BASE_URL=https://opencode.ai/zen/v1
VITE_DEFAULT_MODEL=hy3-free
```

---

## 📜 License

MIT License — free for educational and non-commercial accessibility use.
