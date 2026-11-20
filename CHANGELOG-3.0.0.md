# Changelog — 3.0.0 (UPSC Preparation Centre)
## Added
- `src/upsc/` — lite.js (dashboard summary, merge, CSS), core.js (shared helpers, links to existing quizzes/notes/AI), overview.js, syllabus.js (+data-syllabus.js), memlab.js (+data-mem.js), flash.js (+flash-ai.js), planner.js, ca.js, net.js, doubt.js, index.js (lazy router), upsc.css.
- Sidebar group "UPSC PREPARATION CENTRE"; mobile More → UPSC Preparation Centre; dashboard "Your UPSC overview" panel.
- Electron: `quizinox:fetch-text` IPC + minimal `window.quizinoxNet.fetchText` bridge (http/https text only).
- Capacitor: `CapacitorHttp` enabled (built-in plugin, no new dependency) for Current Affairs fetching.
## Changed in existing files (the only edits)
- `src/main.js`: import of `upsc/lite.js`; version 3.0.0; nav group markup; `MORE_TABS` extended; router map extended; More sheet entry; dashboard panel; backup *merge* also merges `upsc`; `upscCtx` loader.
- `electron/main.cjs`, `electron/preload.cjs`, `capacitor.config.json`, `package.json` (version).
## Not changed
quiz engine, Exam/Practice/OMR, mocks, revision, analytics, achievements, AI engine & settings, PDF/TXT tools, File Studio, storage layer, boot, workflows.
## Dependencies
None added.
