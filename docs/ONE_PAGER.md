# EchoGraph

### Turning inaccessible educational visuals into interactive spoken learning

## The barrier

Amara is a representative 16-year-old blind student taking AP Biology. Her screen reader can read the lesson text, but not the knowledge locked inside an unlabeled graph, scientific diagram, flowchart, or worksheet image. When the only description is `image_1.png`, the lesson stops even though Amara is ready to learn.

## The idea

EchoGraph does not stop at a one-sentence caption. It converts an educational image into a structured learning experience that a student can hear, explore step by step, and question.

A student can:

- upload, drop, or paste a diagram;
- hear its purpose, layout, labels, values, trends, and relationships;
- inspect exact visual details separately from the learner-friendly explanation;
- ask follow-up questions by voice or text;
- request simple, standard, or detailed answers; and
- hear answers through a selected voice.

## How it works

```text
Upload or paste image
        |
        v
Mistral vision analysis
        |
        v
Structured diagram understanding
        |
        +------> Spoken accessible explanation
        |
        v
OpenCode tutor <------ Voice or text question
        |
        v
Spoken, diagram-grounded answer
```

Groq Whisper transcribes microphone questions, with Mistral Voxtral as a fallback. Browser speech provides dependable text-to-speech without requiring a cloud voice profile. Numeric charts can also be heard as a pitch curve.

## Why this approach is different

The visual becomes an explorable knowledge model rather than a disposable caption. A student can move through individual parts, compare values, ask why a trend matters, or request a quiz. When the vision model cannot read something confidently, EchoGraph presents that uncertainty instead of labeling the answer as independently verified.

## Built and working

The current prototype supports image upload and paste, live Mistral analysis, structured results, spoken playback, voice and text tutoring, answer-detail controls, device-aware voices, real-value sonification, keyboard navigation, screen-reader announcements, high contrast, reduced motion, provider fallback, and a credential-free public interface when server keys are configured by the host.

Environment-dependent features are stated plainly: microphone access requires permission and HTTPS, cloud TTS requires a Mistral voice profile, browser voices vary by device, and AI analysis can still make mistakes on unclear images. Formal testing with blind students and major screen readers remains the next validation step.

## Technology and disclosure

React, TypeScript, Vite, Tailwind CSS, and daisyUI power the interface. Runtime AI services are Mistral `mistral-small-latest` / `ministral-8b-latest` for vision, OpenCode Zen `nemotron-3-ultra-free` / `laguna-s-2.1-free` for tutoring, Groq `whisper-large-v3` with Mistral `voxtral-mini-2602` fallback for transcription, and optional Mistral `voxtral-mini-tts-2603` plus browser Web Speech for playback. Google Antigravity and OpenAI Codex assisted development. No external datasets are used; sample diagrams are project-authored SVG fixtures.

## What I learned

Accessibility has to shape the workflow from the first interaction. The important question is not whether a page has an accessibility toggle; it is whether the same student can independently reach the knowledge, inspect uncertainty, ask questions, and keep learning.
