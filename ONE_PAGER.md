# EchoGraph — One-Pager

> **"Turns chart and graph images into spoken descriptions for blind and low-vision students."**

---

## 👤 Who We Built This For

**Amara, 16, legally blind, taking AP Biology.**

Her textbook and worksheets are full of bar charts, line graphs, and labeled diagrams. The digital materials either have no alt text or something useless like `image1.png`. 

Her screen reader has nothing to read when she hits one of these figures — she is locked out of a real chunk of every chapter, not because the science is hard, but because the material was delivered as a picture with no text behind it.

---

## 🚫 The Barrier

**Chart and graph images in STEM material are effectively invisible to screen readers.**

This is not a general "AI can't see" problem — it is specifically that educational content assumes visual delivery is fine, and never accounts for the student who cannot see it.

---

## ⚙️ How It Works

1. **Upload or Paste:** The student uploads or pastes an image of a chart, graph, or diagram — a screenshot prepared by a teacher, a worksheet scan, or a phone photo of a textbook page.
2. **Structured Vision Analysis:** A vision-capable model analyzes the image and generates a structured description: the type of chart, what is being measured, the actual data and trends, and why it matters in the lesson.
3. **AI Self-Verification Pass:** Before finalizing, a second AI pass cross-checks the draft description against the source image and flags anything uncertain or possibly wrong — ensuring a blind student is never relying on a guess dressed up as fact.
4. **Accessible Delivery:** The result appears as properly structured, screen-reader-friendly text (`aria-live`). If the student has VoiceOver, NVDA, or JAWS active, their screen reader announces and reads the text naturally. A manual **"▶ Replay Audio"** button is also provided for on-demand playback.

---

## 💡 Why This Is Different

Most "AI + accessibility" tools stop at generating a vague one-sentence caption. 

**EchoGraph treats accuracy as the safety requirement it actually is.** A wrong description of a science graph does not just annoy a user — it teaches a blind student the wrong science. The verification pass is a core safety feature, not a decorative bonus.

---

## 🤖 AI Tools Used (Required Disclosure)

- **AI Model & Inference:** Featherless AI (`google/gemma-3-27b-it`) & OpenCode AI (`hy3-free`, `mimo-v2.5-free`)
- **Coding Assistant:** Google Antigravity (architecture, accessible UI components, Web Audio sonification, WCAG compliance)
