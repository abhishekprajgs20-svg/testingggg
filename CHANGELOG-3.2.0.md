# 3.2.0
Added: src/studio/* (notes, vault, teach, roadmap, debate, content, omr-eval, core, lite, index), src/voice.js, aiTranscribe + multi-AI rotation in src/ai.js.
Changed: main.js (nav group, routing, UPSC panel removed from Home, OMR attempt stores sheet size, result page OMR panel, multi-AI settings), ai-assist.js/doubt.js (shared voice input), electron/main.cjs (microphone permission), .github/workflows/build-apk.yml (RECORD_AUDIO permission step), style.css.
Data: new optional `db.studio` (notes, vault, teach, roadmap, debate, content); included in backup/restore. Setting keys `aiMulti`, `aiMultiProviders`.
