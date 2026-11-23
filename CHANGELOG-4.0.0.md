# QUIZINOX v4.0.0 — "Learning Tools" release

## New features

### 1. Home screen cleanup
- The "UPSC PREPARATION CENTRE / Your UPSC overview" block is removed from the Home screen. All UPSC content itself (Overview, Syllabus, Planner, Flashcards, Mem Lab, CA, Doubt Engine) is untouched.

### 2. Notes Hub (🗒)
- Paste anything, upload PDFs (text extracted on-device) or fetch an AI-written note from a topic.
- Unlimited nested subsections — folders inside folders inside folders, breadcrumbs to jump back.
- AI tools per note: Summarize, Expand, Key points, Explain simply.
- Global search across every note and subsection, rename/delete, export as .md.

### 3. OMR evaluation + OMR sheet export (▥)
- After submitting in OMR mode, the result screen now shows a colour-coded OMR evaluation panel (green/red/grey per question).
- Export the filled OMR answer sheet as a **print-ready PNG image** or **PDF** — bubbles drawn exactly as filled, correct option ringed, score header with name/roll/date fields.

### 4. Teach Me Mode — QUIZINOX Teacher (🎓)
- A dedicated AI teacher that reads your real learning data: quizzes, attempts, accuracy by subject/topic, mistake notebook and revision state.
- Teaches any topic zero → advanced: **concept → example → 3–5 questions → verify understanding**.
- Wrong answer? The teacher re-explains simpler, with another example.
- Understanding level: Auto (judged from your data) / Beginner / Intermediate / Advanced.
- Weak-concept chips on the home screen of the mode; full session history kept.

### 5. Personal Knowledge Vault (🗄)
- Searchable personal library for facts, explanations, notes, **screenshots/images** (auto-compressed) and difficult concepts.
- Categories + AI-suggested tags, full-text search, edit in place.
- Per item: ✦ Ask AI · ✦ Quiz me from this (turns it into a playable quiz) · ⇩ Export · Delete.

### 6. Exam Countdown Roadmap (🗓)
- Add **unlimited** exams/dated targets — each gets a live countdown (days/weeks/tasks-left digit cards).
- Dynamic roadmap auto-built from days remaining (syllabus → consolidation → revision → mocks → practice → final stretch).
- Completing tasks **rebalances the remaining plan** across the days left; overdue tasks highlighted.
- ✦ AI roadmap (personalised from your syllabus note), one-tap "Take a timed mock".

### 7. Discussion Room — Debate With AI (⚖)
- Six modes: **Debate** (AI takes the opposite side), **Group Discussion simulation** (3-personality panel), **UPSC Interview Discussion**, **Pros & Cons Analysis**, **Ethical Dilemma** (GS-IV), **Mains Answer Discussion**.
- Type **or speak** your arguments — 🎤 voice input via Web Speech API with microphone permission requested on first use (Android app + Windows/Chrome/Edge).
- AI counters and probes each round; end the session to get the **AI Judge**: scores for factual accuracy, logical reasoning, argument quality, handling counterpoints, structure — plus a verdict and concrete improvements.

### 8. Content Creator Studio (🛠)
- One source (PDF upload / TXT / paste) → many outputs. Pick any combination:
  chapter-wise notes · important facts doc · MCQ set · flashcards · statement-based questions · printable revision sheet · question paper (PDF) · practice worksheet · timed mock test.
- Content Pipeline: every output is **linked to its source**, generated one-by-one with progress, and independently **editable, regenerable, exportable** (MD / PDF).
- MCQ & mock outputs save straight into the Quiz Library; flashcards land in the Flashcards deck.

### 9. Multi-AI pool rotation (settings toggle)
- New **"Multi-AI pool rotation"** switch in AI Settings (on by default).
- ON: every AI request rotates across **all** enabled providers and all their keys (Gemini → Groq → OpenRouter → … round-robin), so load never sits on one provider's keys — the existing per-key pacing/rotation stays intact.
- OFF: previous behaviour (main AI first, others as fallback only).

## Technical
- Version 3.1.0 → 4.0.0. Fully offline-first; all new data lives in on-device storage, nothing leaves the device except explicit AI calls.
- Build: `npm install && npm run build` (dist/ included in this zip).
