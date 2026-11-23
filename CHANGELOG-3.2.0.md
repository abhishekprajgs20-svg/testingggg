# QUIZINOX 3.2.0

## New learning workspace
- Removed only the UPSC overview panel from the Overview home screen. The UPSC Preparation Centre navigation and its existing sections remain available.
- Added Notes & Notebooks with paste/edit support, nested folders and subsections, PDF/TXT import, URL import where the app/network permits it, local search and AI-assisted search across saved notes.
- Added Personal Knowledge Vault for searchable facts, explanations, difficult concepts, quiz mistakes, screenshots, text files and PDF references. Items support tags, editing, copying and deletion; the vault can answer questions from its extracted/saved text. Added a visual study canvas with stylus/touch/mouse drawing, pen, highlighter, eraser, colours, undo/redo, PNG export, saved canvas snapshots and a companion AI panel that uses typed context and saved text.
- Added unlimited Exam Countdown Roadmaps. Each exam or milestone can have its own date and syllabus; study, revision, mock, analysis and final-revision tasks are scheduled and pending dates are redistributed when tasks are completed.
- Added QUIZINOX Teacher / Teach Me Mode. Lessons use available quiz attempts, mistakes, revision history, notes and vault entries for context, then provide an explanation, worked example and four progressively harder understanding checks. Incorrect answers trigger a simpler reteaching explanation. Previous lessons are saved.
- Added Discussion Room modes for AI debate, group discussion simulation, UPSC interview, pros/cons, ethical dilemmas and Mains answer discussion. Sessions can be revisited and evaluated by an AI judge across logic, evidence, rebuttal, clarity and balance. Voice input uses supported speech recognition with Android keyboard dictation / Windows Win+H fallback.
- Added Content Creator Studio. One PDF/TXT/pasted source can produce notes, facts, MCQs, native QUIZINOX mock tests, flashcards, statement questions, revision sheets, presentation outlines and worksheets. Native mock tests are inserted into My Quizzes and linked back to the original source. MCQ, flashcard and statement quantities are adjustable up to 100 and generated in smaller batches. Outputs retain the original source text/name and can be edited, regenerated and exported separately as TXT, HTML or PDF.

## OMR and AI routing
- Added bubble-by-bubble OMR evaluation after submission, including selected/correct bubbles, status, accuracy, negative-mark breakdown and net score.
- Added OMR answer-sheet PNG export and printable multi-page evaluation PDF export.
- Added optional multi-provider API rotation. Select two or more providers (for example Gemini + Groq); new AI requests rotate their starting provider while retaining per-key balancing, quota guards, model fallbacks and the existing cross-provider fallback switch. Each individual response still comes from one provider/model. The option is off by default, preserving the previous routing behaviour.
- Added microphone permission handling to the Android APK GitHub Actions workflow and audio permission handling for the Electron app.

## Compatibility and limitations
- Existing quiz, attempt, OMR, settings and UPSC data remain in the same local database; older saved state is normalised with empty defaults for the new collections.
- AI-powered actions need internet access and a configured API provider or supported AI login. Notes, local search, saved vault items and roadmaps work offline.
- PDF import extracts selectable text. Image-only/scanned PDFs and screenshot contents are stored as references but are not OCR-processed by this release.
- Browser/device speech recognition support varies. When unavailable, use the phone keyboard microphone or Windows voice typing (Win + H).
- The presentation output is an editable slide-by-slide outline, not a generated .pptx file. The study canvas saves the handwriting/drawing as an image; its AI panel analyses typed context and saved text, not handwriting pixels.
