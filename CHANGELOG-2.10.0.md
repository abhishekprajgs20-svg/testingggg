# QUIZINOX 2.10.0 — Changelog

## Added
- UPSC Preparation Centre navigation group.
- UPSC Overview with exam-stage and preparation-strategy panels.
- Local syllabus progress tracking with paper/subject/topic starter structure.
- Memorisation Lab with 14 UPSC factual-learning categories and user-entered, source-backed recall facts.
- Flashcards with local persistence and Again/Hard/Easy review scheduling.
- Study Planner with dated tasks, subject selection, completion tracking and optional AI weekly plan.
- Current Affairs personal reading log with source/date/category/summary and read status.
- AI Doubt Solver with explanation modes and conversation history.
- UPSC module data included in existing backup and restore (merge/replace).

## Preserved
- Existing quiz creation/player, Exam Mode/Practice Mode, PYQ and notes systems, revision, analytics, mock/section tests, AI Studio and provider settings, File Studio, achievements, and Android/Electron build configuration remain in place.
- New local data uses a separate storage key and does not migrate or overwrite the existing quiz database.

## Limitations
- Current Affairs live RSS/API ingestion is not configured; entries are user-added and remain available offline.
- No authoritative national-park/river/constitutional dataset or geographic map is bundled. Users can add verified facts with source references.
- The syllabus tracker includes an editable starter topic map, not a complete official micro-syllabus for every optional subject.
- Flashcard TXT/JSON bulk import, full calendar views, voice input, detailed timer/session capture, and richer cross-linking to existing notes/quizzes are not included in this initial implementation.
